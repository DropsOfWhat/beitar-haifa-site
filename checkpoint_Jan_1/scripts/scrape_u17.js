const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEAM_ID = 3340;
const TEAM_NAME = 'נערים א - בית"ר חיפה "טום לוי" "צו פיוס"'; // Exact name from db.json
const TARGET_URL = 'https://www.football.org.il/team-details/team-games/?team_id=3340&season_id=27';
const DB_PATH = path.join(__dirname, '../db.json');

async function scrapeU17() {
    console.log(`Starting U17 (${TEAM_NAME}) scrape...`);
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

            // Helper to clean strings
            const clean = (str) => {
                if (!str) return '';
                return str.replace('תוצאה', '').replace('משחק', '').replace('מחזור', '').trim();
            };

            rows.forEach(row => {
                if (!row.href.includes('game_id') && !row.href.includes('game-details')) return;

                const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());

                // Filter out "Round" headers/rows that might be mis-identified
                if (cells.some(c => c.includes('סבב'))) return;

                const dateMatch = cells.find(c => /\d{2}\/\d{2}\/\d{4}/.test(c));
                const date = clean(dateMatch) || '';

                const scoreMatch = cells.find(c => /\d+-\d+/.test(c));
                const timeMatch = cells.find(c => /\d{2}:\d{2}/.test(c));

                const result_score = clean(scoreMatch) || '';
                const time = clean(timeMatch) || '';

                // Find column with the team names. Usually contains a dash, but NOT the score/date.
                // Look for a dash that is likely a separator.
                const matchCell = cells.find(c => {
                    return (c.includes('-') || c.includes('–')) &&
                        !/\d+-\d+/.test(c) &&
                        !/\d{2}\/\d{2}\/\d{4}/.test(c);
                });

                let homeTeam = 'Unknown';
                let awayTeam = 'Unknown';
                let opponent = 'Unknown';
                let home_away = 'Unknown';

                if (matchCell) {
                    // Normalize dashes
                    const safeCell = matchCell.replace(/–/g, '-').replace(/—/g, '-');

                    // Attempt to split by " - " first (space hyphen space) to be cleaner
                    let parts = safeCell.split(' - ');
                    if (parts.length < 2) {
                        parts = safeCell.split('-'); // Fallback to tight hyphen
                    }

                    // Clean parts
                    parts = parts.map(p => p.trim());

                    if (parts.length >= 2) {
                        // Identify "Us"
                        // Our name parts: "בית"ר חיפה", "טום לוי"
                        const isUs = (name) => name.includes('בית"ר חיפה') || name.includes('טום לוי');

                        const homeIsUs = isUs(parts[0]);
                        const awayIsUs = isUs(parts[parts.length - 1]); // Check last part for away

                        if (homeIsUs) {
                            homeTeam = 'בית"ר חיפה';
                            // Join the rest as opponent
                            awayTeam = parts.slice(1).join('-');
                            home_away = 'Home';
                            opponent = awayTeam;
                        } else if (awayIsUs) {
                            awayTeam = 'בית"ר חיפה';
                            homeTeam = parts.slice(0, parts.length - 1).join('-');
                            home_away = 'Away';
                            opponent = homeTeam;
                        } else {
                            // Try best guess - usually parsing missed.
                            homeTeam = parts[0];
                            awayTeam = parts[1];
                            opponent = awayTeam; // Default
                        }
                    } else {
                        opponent = safeCell; // Couldn't split
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

        console.log(`Scraped ${games.length} games for U17.`);

        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        // Find team by URL component (ID) to be safer than name matching
        const teamIndex = db.teams.findIndex(t => t.url && t.url.includes('team_id=3340'));

        if (teamIndex !== -1) {
            db.teams[teamIndex].games = games;
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            console.log(`Database updated for U17 (Index ${teamIndex}).`);
        } else {
            console.error(`Team with ID 3340 not found in DB!`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

scrapeU17();
