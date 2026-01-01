const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

// Vole Scraper Function
const scrapeVoleData = async (page, url) => {
    console.log(`Using Vole scraper for: ${url}`);

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // 1. Scrape Standings (Table)
        const standings = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr'));

            // Find Beitar row
            const beitarRow = rows.find(tr => tr.innerText.includes('בית"ר חיפה') || tr.innerText.includes('בית”ר חיפה'));

            if (!beitarRow) return null;

            const cells = Array.from(beitarRow.querySelectorAll('td')).map(td => td.innerText.trim());
            // Filter empty cells
            const data = cells.filter(c => c.length > 0);

            // Standard Vole Layout: Rank, Team, Games, Wins, Draws, Losses, Goals, Points
            // |17| בית"ר חיפה |10|1|1|8|7 - 29|4
            const goalsIndex = data.findIndex(c => c.includes('-'));

            return {
                rank: data[0],
                team: 'בית"ר חיפה',
                games: data[2],
                wins: data[3],
                draws: data[4],
                losses: data[5],
                goals: data[goalsIndex],
                points: data[data.length - 1]
            };
        });

        console.log('Vole Standings:', standings);

        // 2. Scrape Games
        // Click "Games" tab
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('li'));
            const gamesTab = tabs.find(el => el.innerText.includes('משחקים'));
            if (gamesTab) gamesTab.click();
        });

        // Wait for content load
        await new Promise(r => setTimeout(r, 4000));

        const games = await page.evaluate(() => {
            // Find game containers using generic class match and ensure it has Beitar text
            const gameDivs = Array.from(document.querySelectorAll('div[class*="game_container"]')).filter(el =>
                el.innerText.includes('בית"ר חיפה') || el.innerText.includes('בית”ר חיפה')
            );

            // Map valid game containers
            return gameDivs.map(el => {
                const text = el.innerText.replace(/\n/g, ' ').replace(/\t/g, ' ');
                // Extract Time
                const timeMatch = text.match(/\d{2}:\d{2}/);
                const time = timeMatch ? timeMatch[0] : '00:00';

                // Extract Date (DD.MM)
                const dateMatch = text.match(/\d{1,2}\.\d{1,2}/);
                const dateRaw = dateMatch ? dateMatch[0] : '';
                const date = dateRaw ? `${dateRaw}.2026` : '2025/26';

                // Extract Score
                const scoreMatch = text.match(/\d+\s*-\s*\d+/);
                const result_score = scoreMatch ? scoreMatch[0] : '';

                // Clean text for opponent name
                let clean = text
                    .replace('בית"ר חיפה', '')
                    .replace('בית”ר חיפה', '')
                    .replace(time, '')
                    .replace(dateRaw, '')
                    .replace(result_score, '')
                    .replace('דווח תוצאה', '')
                    .replace('סיכום', '')
                    .replace('שבת', '')
                    .replace('שישי', '')
                    .replace('ראשון', '')
                    .replace('שני', '')
                    .replace('שלישי', '')
                    .replace('רביעי', '')
                    .replace('חמישי', '')
                    .replace('מחזור', '')
                    .replace(/\d+/g, '') // Remove loose numbers like round number
                    .trim();

                const opponent = clean.replace(/[-–]/g, '').trim();

                // Determine Home/Away based on position in string
                const beitarIdx = text.indexOf('בית"ר חיפה');
                // Standard format: HOME ... AWAY
                // If Beitar is earlier in the string, it is Home.

                let homeTeam, awayTeam;
                if (beitarIdx < 50) { // Rough check, Beitar appears early
                    homeTeam = 'בית"ר חיפה';
                    awayTeam = opponent;
                } else {
                    homeTeam = opponent;
                    awayTeam = 'בית"ר חיפה';
                }

                return {
                    date,
                    time,
                    opponent: opponent || 'Unknown Match',
                    result_score,
                    homeTeam: homeTeam || 'בית"ר חיפה',
                    awayTeam: awayTeam || opponent
                };
            });
        });

        console.log('Vole Games:', games);

        return { standings: standings ? [standings] : [], games: games || [] };

    } catch (e) {
        console.error('Error in Vole scraper:', e);
        return { standings: [], games: [] };
    }
};

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

            // SPECIAL HANDLER: Yeladim A Sharon -> Vole
            if (team.name === 'ילדים א שרון') {
                const voleData = await scrapeVoleData(page, 'https://vole.one.co.il/league/1169');
                if (voleData.standings.length > 0) team.standings = voleData.standings;
                if (voleData.games.length > 0) {
                    team.games = voleData.games.map(g => ({
                        date: g.date,
                        time: g.time,
                        homeTeam: g.homeTeam || 'Unknown',
                        awayTeam: g.awayTeam || 'Unknown',
                        opponent: g.opponent || 'Unknown',
                        result_score: g.result_score,
                        home_away: 'Unknown' // Logic can be improved
                    }));
                    console.log(`Updated ${team.games.length} games and standings for ${team.name} from Vole`);
                }
                continue; // Skip standard scraper
            }

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

                        // CLEANING FUNCTIONS
                        const clean = (str) => str.replace(/^(תאריך|שעה|תוצאה|משחק)/, '').trim();

                        const cleanTeamName = (name) => {
                            let cleaned = name.trim();

                            // Remove "Avi Ran-" prefix
                            cleaned = cleaned.replace(/^אבי רן[-.]?\s*|אבי-רן\s*/, '');

                            // Standardize Beitar Haifa
                            if (cleaned.includes('בית"ר חיפה') || cleaned.includes('ב.חיפה') || cleaned.includes('בית"ר יעקב')) {
                                return 'בית"ר חיפה';
                            }

                            return cleaned;
                        };

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
                                homeTeam = cleanTeamName(parts[0]);
                                // Join the rest in case there are multiple dashes (rare but safe)
                                awayTeam = cleanTeamName(parts.slice(1).join('-').trim());
                            } else {
                                console.log(`Warning: Could not split teams from '${matchCell}'`);
                                // Fallback: try to guess or leave as unknown to avoid duplication
                            }
                        }

                        results.push({
                            date,
                            time,
                            homeTeam,
                            awayTeam,
                            opponent: `${homeTeam} - ${awayTeam}`, // Keep standard format
                            result_score: score,
                            home_away: 'Unknown' // Logic to determine home/away if needed
                        });
                    });

                    return results;
                });

                if (games.length > 0) {
                    team.games = games;
                    console.log(`  -> Found ${games.length} games.`);
                } else {
                    console.log(`  -> No games found.`);
                }

            } catch (e) {
                console.error(`  -> Error scraping games: ${e.message}`);
            }

            // --- 2. Fetch Standings ---
            // Only if "league_id" exists or we can infer URL
            // Assuming table URL is generic or we extract it.
            // For simplicity, using the team page which often has the table OR constructing table URL.
            // But football.org.il usually has a league table tab.

            // Construct Table URL (heuristic: league_id needed, but we don't have it in db.json usually)
            // However, we can go to team page -> "League Table" tab.
            const tableUrl = `https://www.football.org.il/team-details/team-table/?team_id=${teamId}&season_id=${seasonId}`;

            try {
                await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

                const standings = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('tr'));
                    // Find header
                    // Find team row
                    const results = [];

                    const cleanTeamName = (name) => {
                        let cleaned = name.trim();
                        // Remove "Avi Ran-" prefix
                        cleaned = cleaned.replace(/^אבי רן[-.]?\s*|אבי-רן\s*/, '');
                        if (cleaned.includes('בית"ר חיפה') || cleaned.includes('ב.חיפה') || cleaned.includes('בית"ר יעקב')) {
                            return 'בית"ר חיפה';
                        }
                        return cleaned;
                    };

                    // Looking for row with team name (might be "Beitar Haifa" etc)
                    // If we want FULL table, we scrape all. If just our position, we find us.
                    // Let's scrape relative info if possible.
                    // For now, let's grab the row for 'בית"ר חיפה' if exists.

                    const myRow = rows.find(r => r.innerText.includes('בית"ר חיפה') || r.innerText.includes('ב.חיפה') || r.innerText.includes('בית"ר יעקב'));

                    if (myRow) {
                        const cells = Array.from(myRow.querySelectorAll('td')).map(c => c.innerText.trim());
                        // Index 0: Rank, 1: Team, ...
                        // Need mapping. Usually: Rank, Team, Games, Wins, Draws, Losses, Goals, Points

                        return {
                            rank: cells[0] || '-',
                            team: cleanTeamName(cells[1] || 'Unknown'), // Clean here too!
                            games: cells[2] || '0',
                            pts: cells[cells.length - 1] || '0',
                            // ... other stats if needed
                            wins: cells[3] || '0',
                            draws: cells[4] || '0',
                            losses: cells[5] || '0',
                            goals: cells[6] || '0-0',
                            points: cells[cells.length - 1] || '0'
                        };
                    }
                    return null;
                });

                if (standings) {
                    team.standings = [standings]; // Array for consistency
                    console.log(`  -> Found standings: Rank ${standings.rank}`);
                } else {
                    // console.log(`  -> No standings found.`);
                }

            } catch (e) {
                console.error(`  -> Error scraping table: ${e.message}`);
            }
        }

        // Save updated DB
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Database updated successfully!');

    } catch (e) {
        console.error('Fatal error during sync:', e);
    } finally {
        await browser.close();
    }
}

syncData();
