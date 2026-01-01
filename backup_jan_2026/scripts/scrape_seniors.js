const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEAM_NAME = 'בוגרים - בית"ר חיפה יעקב';
const TARGET_URL = 'https://www.football.org.il/team-details/team-games/?team_id=3586&season_id=27';
const DB_PATH = path.join(__dirname, '../db.json');

async function scrapeSeniors() {
    console.log('Starting Seniors scrape...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`Navigating to ${TARGET_URL}`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for the games table (generic selector for the row)
        await page.waitForSelector('a.table_row', { timeout: 10000 });

        const games = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('a.table_row'));
            const results = [];

            rows.forEach(row => {
                // Ensure it's a game row (has game_id usually)
                if (!row.href.includes('game_id') && !row.href.includes('game-details')) return;

                const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());
                // Expected rough structure based on previous scraping:
                // [Date, Matchday, Match(Home-Away), Stadium, Time, Score]
                // Example: ["10/05/2024", "מחזור 26", "בית\"ר חיפה - מ.כ. ...", "אצטדיון...", "13:00", "0-3"]

                // Regex for date DD/MM/YYYY
                const dateMatch = cells.find(c => /\d{2}\/\d{2}\/\d{4}/.test(c));
                const date = dateMatch || '';

                // Score or Time
                // Score is usually X-Y. Time is HH:MM.
                // We want specifically "Result (or time if not played)".
                const scoreMatch = cells.find(c => /\d+-\d+/.test(c)); // 1-2
                const timeMatch = cells.find(c => /\d{2}:\d{2}/.test(c)); // 14:00

                const result_score = scoreMatch || '';
                const time = timeMatch || '';

                // Opponent / Home / Away
                // The "Match" cell usually contains "Team A - Team B"
                const matchCell = cells.find(c => c.includes('-') && !/\d+-\d+/.test(c) && !/\d{2}\/\d{2}\/\d{4}/.test(c));

                let homeTeam = 'Unknown';
                let awayTeam = 'Unknown';
                let opponent = 'Unknown';
                let home_away = 'Unknown';

                if (matchCell) {
                    const parts = matchCell.split('-').map(s => s.trim());
                    if (parts.length >= 2) {
                        homeTeam = parts[0];
                        awayTeam = parts[1];

                        // We know OUR team name roughly "בית\"ר חיפה"
                        if (homeTeam.includes('בית"ר חיפה')) {
                            home_away = 'Home';
                            opponent = awayTeam;
                        } else if (awayTeam.includes('בית"ר חיפה')) {
                            home_away = 'Away';
                            opponent = homeTeam;
                        } else {
                            // Fallback
                            opponent = matchCell;
                        }
                    }
                }

                results.push({
                    date,
                    time,
                    result_score,
                    home_away,
                    opponent,
                    // Store strict Home/Away for better UI logic
                    homeTeam,
                    awayTeam
                });
            });
            return results;
        });

        console.log(`Scraped ${games.length} games.`);

        // Updating DB
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        const teamIndex = db.teams.findIndex(t => t.name === TEAM_NAME);

        if (teamIndex !== -1) {
            db.teams[teamIndex].games = games;
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            console.log('Database updated.');
        } else {
            console.error('Team not found in DB!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

scrapeSeniors();
