const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const DB_PATH = path.join(__dirname, '../db.json');

async function syncData() {
    console.log('Starting data synchronization with Stealth Mode...');

    if (!fs.existsSync(DB_PATH)) {
        console.error('db.json not found!');
        process.exit(1);
    }
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const teams = db.teams;

    console.log(`Loaded ${teams.length} teams from db.json.`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--lang=he-IL',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Generic headers to look real
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            console.log(`[${i + 1}/${teams.length}] Syncing ${team.name}...`);

            const urlObj = new URL(team.url);
            const teamId = urlObj.searchParams.get('team_id');
            const seasonId = 27; // Force season 27 per user context or extract from URL? URL usually has it.
            // Using existing logic to get seasonId from URL if present, else default
            const urlSeason = urlObj.searchParams.get('season_id') || '27';

            if (!teamId) {
                console.error(`  -> Could not extract team_id from ${team.url}`);
                continue;
            }

            // --- 1. Fetch Games from IFA ---
            // (Using existing game scraping logic since it works well)
            const gamesUrl = `https://www.football.org.il/team-details/team-games/?team_id=${teamId}&season_id=${urlSeason}`;
            try {
                await page.goto(gamesUrl, { waitUntil: 'networkidle2', timeout: 45000 });
                const games = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('a.table_row'));
                    const results = [];
                    const clean = (str) => str.replace(/^(תאריך|שעה|תוצאה|משחק)/, '').trim();
                    const cleanTeamName = (name) => {
                        let cleaned = name.trim();
                        cleaned = cleaned.replace(/^אבי רן[-.]?\s*|אבי-רן\s*/, '');
                        if (cleaned.includes('בית"ר חיפה') || cleaned.includes('ב.חיפה') || cleaned.includes('בית"ר יעקב')) return 'בית"ר חיפה';
                        return cleaned;
                    };

                    rows.forEach(row => {
                        if (!row.href.includes('game')) return;
                        const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());

                        // Basic extraction (heuristic based)
                        const date = clean(cells.find(c => /\d{2}\/\d{2}\/\d{4}/.test(c)) || '');
                        const time = clean(cells.find(c => /\d{2}:\d{2}/.test(c)) || '');
                        const score = clean(cells.find(c => /\d+-\d+/.test(c)) || '');
                        const matchCell = cells.find(c => c.includes('-') && !/\d+-\d+/.test(c) && !/\d{2}\/\d{2}\/\d{4}/.test(c));

                        let homeTeam = 'Unknown', awayTeam = 'Unknown';
                        if (matchCell) {
                            const parts = clean(matchCell).split(/[-–—]/).map(s => s.trim());
                            if (parts.length >= 2) {
                                homeTeam = cleanTeamName(parts[0]);
                                awayTeam = cleanTeamName(parts.slice(1).join('-').trim());
                            }
                        }

                        results.push({
                            date, time, homeTeam, awayTeam,
                            opponent: `${homeTeam} - ${awayTeam}`,
                            result_score: score,
                            home_away: 'Unknown'
                        });
                    });
                    return results;
                });

                if (games.length > 0) {
                    team.games = games;
                    console.log(`  -> Found ${games.length} games.`);
                }
            } catch (e) {
                console.error(`  -> Error scraping games: ${e.message}`);
            }

            // --- 2. Fetch Standings ---
            // Explicitly use the table URL
            const tableUrl = `https://www.football.org.il/team-details/team-table/?team_id=${teamId}&season_id=${urlSeason}`;
            try {
                console.log(`  -> Fetching table from: ${tableUrl}`);
                await page.goto(tableUrl, { waitUntil: 'networkidle2', timeout: 45000 });

                // Wait a bit for potential AJAX or rendering
                try { await page.waitForSelector('table', { timeout: 10000 }); } catch (e) { }

                const scrapedTable = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('tr'));
                    // Filter mainly for data rows (assuming >2 columns)
                    // We map ALL rows first
                    return rows.map(tr => {
                        const cells = Array.from(tr.querySelectorAll('td')).map(c => c.innerText.trim());
                        if (cells.length < 3) return null;

                        const cleanTeamName = (name) => {
                            let cleaned = name.trim();
                            cleaned = cleaned.replace('יעקב', '').trim(); // Custom cleanup
                            cleaned = cleaned.replace(/^אבי רן[-.]?\s*|אבי-רן\s*/, '');
                            if (cleaned.includes('בית"ר חיפה') || cleaned.includes('ב.חיפה')) return 'בית"ר חיפה';
                            return cleaned;
                        };

                        return {
                            position: cells[0],
                            team: cleanTeamName(cells[1]),
                            games: cells[2],
                            wins: cells[3],
                            draws: cells[4],
                            losses: cells[5],
                            goals: cells[6],
                            points: cells[cells.length - 1]
                        };
                    }).filter(r => r !== null);
                });

                // --- DATA PROTECTION & VALIDATION ---

                // 1. Empty Check
                if (!scrapedTable || scrapedTable.length === 0) {
                    console.error(`  -> WARN: Scraped table is EMPTY. Skipping update to protect existing data.`);
                    continue; // Skip updating team.table
                }

                // 2. Points Regression Check (Specific to Adults or global?)
                // User asked specifically for the Adults team to be protected.
                if (team.name === 'בוגרים') {
                    const myNewRow = scrapedTable.find(r => r.team === 'בית"ר חיפה');
                    const currentMyRow = (team.table || []).find(r => r.team === 'בית"ר חיפה');

                    if (myNewRow && currentMyRow) {
                        const newPoints = parseInt(myNewRow.points, 10) || 0;
                        const oldPoints = parseInt(currentMyRow.points, 10) || 0;

                        if (newPoints < oldPoints) {
                            console.error(`  -> CRITICAL SANITY CHECK FAILED: New points (${newPoints}) < Old points (${oldPoints}). Aborting table update.`);
                            continue;
                        }
                    }
                    console.log(`  -> Sanity passed. New points: ${myNewRow ? myNewRow.points : 'N/A'}`);
                }

                // If checks pass, update
                team.table = scrapedTable;
                delete team.standings; // cleanup legacy
                console.log(`  -> Table updated with ${scrapedTable.length} rows.`);

            } catch (e) {
                console.error(`  -> Error scraping table: ${e.message}`);
                // On error, do NOT wipe the table. Just keep old data.
            }
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Database updated successfully!');

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await browser.close();
    }
}

syncData();
