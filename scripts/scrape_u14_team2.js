const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://www.football.org.il/team-details/team-games/?team_id=6882&season_id=27';
// Correct URL/ID based on list_teams.js output: 
// 7: ילדים א - בית"ר חיפה 2 (2) - https://www.football.org.il/team-details/?team_id=6882&season_id=27
const TEAM_ID_STR = 'team_id=6882';
const DB_PATH = path.join(__dirname, '../db.json');

async function scrapeU14_2() {
    console.log(`Starting U14 (Yeladim A - Team 2) scrape...`);
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

            const clean = (str) => {
                if (!str) return '';
                return str.replace('תוצאה', '').replace('משחק', '').replace('מחזור', '').trim();
            };

            rows.forEach(row => {
                if (!row.href.includes('game_id') && !row.href.includes('game-details')) return;

                const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());

                if (cells.some(c => c.includes('סבב'))) return;

                const dateMatch = cells.find(c => /\d{2}\/\d{2}\/\d{4}/.test(c));
                const date = clean(dateMatch) || '';

                const scoreMatch = cells.find(c => /\d+-\d+/.test(c));
                const timeMatch = cells.find(c => /\d{2}:\d{2}/.test(c));

                const result_score = clean(scoreMatch) || '';
                const time = clean(timeMatch) || '';

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
                    const safeCell = matchCell.replace(/–/g, '-').replace(/—/g, '-');
                    let parts = safeCell.split(' - ');
                    if (parts.length < 2) {
                        parts = safeCell.split('-');
                    }
                    parts = parts.map(p => p.trim());

                    if (parts.length >= 2) {
                        const isUs = (name) => name.includes('בית"ר חיפה');

                        const homeIsUs = isUs(parts[0]);
                        const awayIsUs = isUs(parts[parts.length - 1]);

                        if (homeIsUs) {
                            homeTeam = 'בית"ר חיפה';
                            awayTeam = parts.slice(1).join('-');
                            home_away = 'Home';
                            opponent = awayTeam;
                        } else if (awayIsUs) {
                            awayTeam = 'בית"ר חיפה';
                            homeTeam = parts.slice(0, parts.length - 1).join('-');
                            home_away = 'Away';
                            opponent = homeTeam;
                        } else {
                            homeTeam = parts[0];
                            awayTeam = parts[1];
                            opponent = awayTeam;
                        }
                    } else {
                        opponent = safeCell;
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

        console.log(`Scraped ${games.length} games for U14 (Team 2).`);

        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        const teamIndex = db.teams.findIndex(t => t.url && t.url.includes(TEAM_ID_STR));

        if (teamIndex !== -1) {
            db.teams[teamIndex].games = games;
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            console.log(`Database updated for U14_2 (Index ${teamIndex}).`);
        } else {
            console.error(`Team with ID 6882 not found in DB!`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

scrapeU14_2();
