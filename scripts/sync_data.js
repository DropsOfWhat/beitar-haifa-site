const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

async function syncData() {
    console.log('Starting data synchronization...');

    // 1. Load DB
    if (!fs.existsSync(DB_PATH)) {
        console.error('db.json not found!');
        process.exit(1);
    }
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const teams = db.teams;

    console.log(`Loaded ${teams.length} teams from db.json.`);

    // Launch browser with CI-friendly arguments
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Critical for containerized environments
            '--lang=he-IL'
        ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            console.log(`[${i + 1}/${teams.length}] Syncing ${team.name}...`);

            // Extract IDs
            const urlObj = new URL(team.url);
            const teamId = urlObj.searchParams.get('team_id');
            const seasonId = urlObj.searchParams.get('season_id') || '27';

            if (!teamId) {
                console.error(`  -> Could not extract team_id from ${team.url}`);
                continue;
            }

            // --- 1. Fetch Games ---
            const gamesUrl = `https://www.football.org.il/team-details/team-games/?team_id=${teamId}&season_id=${seasonId}`;

            try {
                await page.goto(gamesUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

                const games = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('a.table_row'));
                    const results = [];

                    rows.forEach(row => {
                        if (!row.href.includes('game')) return;

                        const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());

                        // CLEANING FUNCTION
                        const clean = (str) => str.replace(/^(תאריך|שעה|תוצאה|משחק)/, '').trim();

                        const date = clean(cells.find(c => /\d{2}\/\d{2}\/\d{4}/.test(c)) || '');
                        const time = clean(cells.find(c => /\d{2}:\d{2}/.test(c)) || '');
                        const score = clean(cells.find(c => /\d+-\d+/.test(c)) || '');

                        const matchCell = cells.find(c => c.includes('-') && !/\d+-\d+/.test(c) && !/\d{2}\/\d{2}\/\d{4}/.test(c));

                        let homeTeam = 'Unknown';
                        let awayTeam = 'Unknown';

                        if (matchCell) {
                            const content = clean(matchCell);
                            // Split by hyphen, en-dash, or em-dash
                            const parts = content.split(/[-–—]/).map(s => s.trim());
                            if (parts.length >= 2) {
                                homeTeam = parts[0];
                                // Join the rest in case there are multiple dashes (rare but safe)
                                awayTeam = parts.slice(1).join('-').trim();
                            } else {
                                console.log(`Warning: Could not split teams from '${matchCell}'`);
                                // Fallback: try to guess or leave as unknown to avoid duplication
                            }
                        }

                        results.push({
                            date,
                            time,
                            result_score: score,
                            homeTeam,
                            awayTeam,
                            opponent: matchCell ? clean(matchCell) : 'Unknown',
                            home_away: 'Unknown'
                        });
                    });
                    return results;
                });

                team.games = games;
                console.log(`  -> Found ${games.length} games.`);

            } catch (e) {
                console.error(`  -> Error fetching games: ${e.message}`);
            }

            // --- 2. Fetch Table ---
            const tableUrl = `https://www.football.org.il/team-details/?team_id=${teamId}&season_id=${seasonId}`;

            try {
                await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

                const table = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('a.table_row'));
                    const results = [];

                    rows.forEach(row => {
                        if (!row.href.includes('team-details')) return;

                        const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());

                        if (!/^\d+$/.test(cells[0])) return;

                        results.push({
                            position: cells[0],
                            team: cells[1],
                            games: cells[2],
                            wins: cells[3],
                            draws: cells[4],
                            losses: cells[5],
                            goals: cells[6],
                            points: cells[cells.length - 1]
                        });
                    });

                    return results;
                });

                if (table.length > 0) {
                    team.table = table;
                    console.log(`  -> Found ${table.length} table entries.`);
                }

            } catch (e) {
                console.error(`  -> Error fetching table: ${e.message}`);
            }

            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Synchronization complete. db.json updated.');

    } catch (error) {
        console.error('Fatal error during sync:', error);
    } finally {
        await browser.close();
    }
}

syncData();
