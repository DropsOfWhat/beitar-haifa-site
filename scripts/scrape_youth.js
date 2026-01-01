const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEAM_NAME = 'נוער - בית"ר חיפה - אבי רן';
const TARGET_URL = 'https://www.football.org.il/team-details/team-games/?team_id=3661&season_id=27';
const DB_PATH = path.join(__dirname, '../db.json');

async function scrapeYouth() {
    console.log('Starting Youth scrape...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`Navigating to ${TARGET_URL}`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('a.table_row', { timeout: 10000 });

        const games = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('a.table_row'));
            const results = [];

            rows.forEach(row => {
                if (!row.href.includes('game_id') && !row.href.includes('game-details')) return;

                const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());

                // Parsing logic similar to Adults but strictly for Youth
                const dateMatch = cells.find(c => /\d{2}\/\d{2}\/\d{4}/.test(c));
                const date = dateMatch || '';

                const scoreMatch = cells.find(c => /\d+-\d+/.test(c));
                const timeMatch = cells.find(c => /\d{2}:\d{2}/.test(c));

                const result_score = scoreMatch || '';
                const time = timeMatch || '';

                const matchCell = cells.find(c => c.includes('-') && !/\d+-\d+/.test(c) && !/\d{2}\/\d{2}\/\d{4}/.test(c));

                let homeTeam = 'Unknown';
                let awayTeam = 'Unknown';
                let opponent = 'Unknown';
                let home_away = 'Unknown';

                if (matchCell) {
                    // Normalize our team name to a placeholder to handle hyphens safely
                    let tempCell = matchCell;
                    const myTeamToken = '@@MYTEAM@@';

                    // Replace longest match first
                    if (tempCell.includes('בית"ר חיפה - אבי רן')) {
                        tempCell = tempCell.replace('בית"ר חיפה - אבי רן', myTeamToken);
                    } else if (tempCell.includes('בית"ר חיפה')) {
                        tempCell = tempCell.replace('בית"ר חיפה', myTeamToken);
                    }

                    const parts = tempCell.split('-').map(s => s.trim());

                    if (parts.length >= 2) {
                        // Check if Home is us
                        if (parts[0].includes(myTeamToken)) {
                            homeTeam = "בית\"ר חיפה"; // Clean display name
                            // Join the rest as the away team (in case opponent matches had hyphens)
                            awayTeam = parts.slice(1).join('-');
                            home_away = 'Home';
                            opponent = awayTeam;
                        }
                        // Check if Away is us
                        // We check the LAST part usually, but let's iterate to be safe? 
                        // Usually it's Team A - Team B. If A is opponent and B is Us.
                        else if (parts[parts.length - 1].includes(myTeamToken)) {
                            awayTeam = "בית\"ר חיפה";
                            homeTeam = parts.slice(0, parts.length - 1).join('-');
                            home_away = 'Away';
                            opponent = homeTeam;
                        }
                        else {
                            // Fallback if our token isn't found at edges (unlikely if logic above worked)
                            homeTeam = parts[0];
                            awayTeam = parts.slice(1).join('-');
                            opponent = matchCell; // Leave as is or try best guess
                        }
                    }
                }

                results.push({
                    date,
                    time,
                    result_score,
                    home_away,
                    opponent,
                    homeTeam,
                    awayTeam
                });
            });
            return results;
        });

        console.log(`Scraped ${games.length} games for Youth.`);

        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        const teamIndex = db.teams.findIndex(t => t.name === TEAM_NAME);

        if (teamIndex !== -1) {
            db.teams[teamIndex].games = games;
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            console.log('Database updated for Youth.');
        } else {
            console.error(`Team "${TEAM_NAME}" not found in DB!`);
            // List available names to debug
            console.log('Available teams:', db.teams.map(t => t.name));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

scrapeYouth();
