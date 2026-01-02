const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

async function syncData() {
    console.log('Starting data synchronization...');

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
            '--lang=he-IL'
        ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 }); // Ensure desktop view for tables

    try {
        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            console.log(`[${i + 1}/${teams.length}] Syncing ${team.name}...`);

            // Standard IFA Scraper Logic
            const urlObj = new URL(team.url);
            const teamId = urlObj.searchParams.get('team_id');
            const seasonId = urlObj.searchParams.get('season_id') || '27';

            if (!teamId) {
                console.error(`  -> Could not extract team_id from ${team.url}`);
                continue;
            }

            // --- 1. Fetch Games from IFA (Schedule Base) ---
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
                            cleaned = cleaned.replace(/^אבי רן[-.]?\s*|אבי-רן\s*/, '');
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
                            const parts = content.split(/[-–—]/).map(s => s.trim());
                            if (parts.length >= 2) {
                                homeTeam = cleanTeamName(parts[0]);
                                awayTeam = cleanTeamName(parts.slice(1).join('-').trim());
                            }
                        }

                        results.push({
                            date,
                            time,
                            homeTeam,
                            awayTeam,
                            opponent: `${homeTeam} - ${awayTeam}`,
                            result_score: score,
                            home_away: 'Unknown'
                        });
                    });
                    return results;
                });

                if (games.length > 0) {
                    team.games = games;
                    console.log(`  -> Found ${games.length} games from IFA.`);
                }

            } catch (e) {
                console.error(`  -> Error scraping games: ${e.message}`);
            }



            // --- 2. Fetch Standings ---
            const tableUrl = `https://www.football.org.il/team-details/team-table/?team_id=${teamId}&season_id=${seasonId}`;

            try {
                await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

                const standings = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('tr'));
                    const cleanTeamName = (name) => {
                        let cleaned = name.trim();
                        cleaned = cleaned.replace(/^אבי רן[-.]?\s*|אבי-רן\s*/, '');
                        if (cleaned.includes('בית"ר חיפה') || cleaned.includes('ב.חיפה') || cleaned.includes('בית"ר גבריאל') || cleaned.includes('בית"ר יעקב')) {
                            return 'בית"ר חיפה';
                        }
                        return cleaned;
                    };

                    const myRow = rows.find(r => r.innerText.includes('בית"ר חיפה') || r.innerText.includes('ב.חיפה') || r.innerText.includes('בית"ר יעקב') || r.innerText.includes('בית"ר גבריאל'));

                    if (myRow) {
                        const cells = Array.from(myRow.querySelectorAll('td')).map(c => c.innerText.trim());
                        // IFA Table Columns: 0:Pos, 1:Team, 2:Games, 3:Wins, 4:Draws, 5:Losses, 6:Goals, ... Last:Points
                        return {
                            position: cells[0] || '-',
                            team: cleanTeamName(cells[1] || 'Unknown'),
                            games: cells[2] || '0',
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
                    team.table = [standings];
                    delete team.standings; // cleanup
                    console.log(`  -> Found table: Position ${standings.position}`);
                }

            } catch (e) {
                console.error(`  -> Error scraping table: ${e.message}`);
            }

        }

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Database updated successfully!');

    } catch (e) {
        console.error('Fatal error during sync:', e);
    } finally {
        await browser.close();
    }
}

syncData();
