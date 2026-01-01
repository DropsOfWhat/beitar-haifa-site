const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CLUB_URL = 'https://www.football.org.il/clubs/club/?club_id=3586';
const DB_PATH = path.join(__dirname, '../db.json');

async function scrape() {
    console.log('Starting scrape...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL']
    });
    const page = await browser.newPage();

    // Set User Agent to avoid immediate blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        // 1. Deep Discovery: Get all team URLs
        console.log(`Navigating to club page: ${CLUB_URL}`);
        await page.goto(CLUB_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        const teams = await page.evaluate(() => {
            // The selector might vary, looking for links in the "teams" table/list
            // Based on typical football.org.il structure:
            const rows = Array.from(document.querySelectorAll('.table_row, .BasicTable tbody tr'));
            // This is a guess. We might need to adjust selectors.
            // Let's try to find links containing "team-details"
            const links = Array.from(document.querySelectorAll('a[href*="team-details"]'));

            const uniqueTeams = [];
            const seenUrls = new Set();

            links.forEach(link => {
                const url = link.href;
                const name = link.textContent.trim();
                if (!seenUrls.has(url) && name) {
                    seenUrls.add(url);
                    uniqueTeams.push({ name, url, games: [], table: [] });
                }
            });
            return uniqueTeams;
        });

        console.log(`Found ${teams.length} teams.`);
        if (teams.length === 0) {
            // Fallback or better selector searching?
            // Let's try a more specific selector strategy if generic failed
            console.log('Trying alternative selector strategy...');
        }

        // 2. Extraction Loop
        for (let i = 0; i < teams.length; i++) {
            // for (let i = 0; i < 1; i++) { // Debug: Test with just 1 team first
            const team = teams[i];
            console.log(`Processing team ${i + 1}/${teams.length}: ${team.name}`);

            try {
                await page.goto(team.url, { waitUntil: 'domcontentloaded', timeout: 45000 });

                // --- Robust Extraction using 'a.table_row' ---
                const rawData = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('a.table_row'));
                    const games = [];
                    const table = [];

                    rows.forEach(row => {
                        const href = row.href || '';
                        const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());

                        // Heuristic: Games usually have game_id, Table rows usually have team_id (or similar structure)
                        // But verifying via content might be safer if hrefs are complex.
                        // Subagent found games have 'game_id'.

                        if (href.includes('game_details') || href.includes('game_id') || href.includes('game-details')) {
                            // Game Row
                            // Expected Index Map (based on subagent): 
                            // 0: Date?, 1: Round?, 2: Teams?, 3: Stadium?, 4: Time?, 5: Score?
                            // We need to be careful. Let's dump the text.
                            // Actually, let's try to map typical fields.
                            // Date is usually looks like DD/MM/YY.
                            // Score looks like X-Y.

                            let date = cells.find(c => c.match(/\d{2}\/\d{2}\/\d{2,4}/)) || '';
                            let time = cells.find(c => c.match(/\d{2}:\d{2}/)) || '';
                            let score = cells.find(c => c.match(/\d+-\d+/)) || '';

                            // Opponent? usually long text not date/time/score.
                            // This is tricky. Let's just store all text and refine later if needed.
                            // But for MatchRow we need: opponent, date, time, score.

                            // Let's assume the order found by subagent:
                            // Date, Matchday, MATCH (Home - Away), Stadium, Time, Result

                            // The "Match" cell usually contains "Team A - Team B".
                            // Or the row is "Home Team" ... "Away Team".
                            // Let's grab the content.

                            games.push({
                                date: date,
                                time: time,
                                opponent: cells[2] || 'Unknown', // Rough guess
                                result_score: score,
                                home_away: 'Unknown', // We'll infer this later or ignore
                                raw_cells: cells
                            });
                        } else if (href.includes('team_details') || href.includes('team_id') || href.includes('team-details')) {
                            // Table Row
                            // Structure: Position, Team, Games, Wins, Draws, Losses, Goals, Points
                            // If index 0 is position (number).
                            table.push({
                                position: cells[0],
                                team: cells[1],
                                games: cells[2],
                                wins: cells[3],
                                draws: cells[4],
                                losses: cells[5],
                                goals: cells[6],
                                points: cells[7]
                            });
                        }
                    });

                    return { games, table };
                });

                // Post-process to clean up "Opponent" from "TeamA - TeamB" string if possible
                // For now, we trust the raw extract.
                team.games = rawData.games;
                team.table = rawData.table;


            } catch (e) {
                console.error(`Error scraping team ${team.name}: ${e.message}`);
            }

            // Random delay to reduce blocking chance
            const delay = Math.floor(Math.random() * 3000) + 2000;
            await new Promise(r => setTimeout(r, delay));
        }

        // 3. Save
        const db = { teams };
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log(`Saved ${teams.length} teams to db.json`);

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        await browser.close();
    }
}

scrape();
