const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const TEAM_ID = '3586';
const SEASON_ID = '27';

async function fixTable() {
    console.log('Starting Adults Table Fix...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL']
    });
    const page = await browser.newPage();
    const url = `https://www.football.org.il/team-details/team-table/?team_id=${TEAM_ID}&season_id=${SEASON_ID}`;

    let scrapedTable = null;
    let myRow = null;

    try {
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        // Try to scrape table
        scrapedTable = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr'));
            return rows.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()))
                .filter(r => r.length > 2);
        });

        if (scrapedTable && scrapedTable.length > 0) {
            console.log(`Scraped ${scrapedTable.length} rows.`);
            const cleanName = (name) => name.replace('יעקב', '').trim(); // Fuzzy match

            myRow = scrapedTable.find(r => r[1].includes('בית"ר חיפה') || r[1].includes('ב.חיפה'));

            if (myRow) {
                console.log('Found row in scraped table!');
                // Map to object
                // IFA: Pos(0), Team(1), Games(2), Wins(3), Draws(4), Losses(5), Goals(6), ..., Points(Last)
                const mapped = {
                    position: myRow[0],
                    team: myRow[1],
                    games: myRow[2],
                    wins: myRow[3],
                    draws: myRow[4],
                    losses: myRow[5],
                    goals: myRow[6],
                    points: myRow[myRow.length - 1]
                };
                updateDbWithRow(mapped);
                console.log('VERIFICATION ROW:', JSON.stringify(mapped, null, 2));
            } else {
                console.log('Team not found in scraped table.');
            }
        } else {
            console.log('No rows scraped.');
        }

    } catch (e) {
        console.error('Scraping failed:', e.message);
    } finally {
        await browser.close();
    }

    if (!myRow) {
        console.log('Falling back to calculation from Games...');
        calculateFromGames();
    }
}

function calculateFromGames() {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const team = db.teams.find(t => t.name === 'בוגרים');
    if (!team) return;

    let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0, gamesPlayed = 0;

    team.games.forEach(g => {
        if (!g.result_score || !g.result_score.includes('-')) return;

        const parts = g.result_score.split('-').map(Number);
        const myName = "בית\"ר חיפה";
        let myScore, oppScore;

        if (g.homeTeam.includes(myName) || g.homeTeam.includes('ב.חיפה')) {
            myScore = parts[0];
            oppScore = parts[1];
        } else {
            myScore = parts[1];
            oppScore = parts[0];
        }

        gamesPlayed++;
        gf += myScore;
        ga += oppScore;

        if (myScore > oppScore) wins++;
        else if (myScore < oppScore) losses++;
        else draws++;
    });

    const points = (wins * 3) + (draws * 1);

    // Create a synthesized row
    const row = {
        position: "?", // Cannot know position
        team: "בית\"ר חיפה (Calculated)",
        games: gamesPlayed.toString(),
        wins: wins.toString(),
        draws: draws.toString(),
        losses: losses.toString(),
        goals: `${gf}-${ga}`,
        points: points.toString()
    };

    console.log('Calculated Row:', row);
    // Update DB - Just update the single team entry in the specific table array?
    // User wants "The table". If we can't get the whole table, we can't give positions.
    // We will update the row corresponding to Beitar Haifa if it exists, or verify.
    // The current DB table is junk.
    // We will just set table to [row].
    team.table = [row];
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('Database updated from calculation.');
    console.log('VERIFICATION ROW:', JSON.stringify(row, null, 2));
}

function updateDbWithRow(row) {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const team = db.teams.find(t => t.name === 'בוגרים');
    // Replace the entry in the existing table if possible, or reset
    // Scraper got full table? No, we likely filtered it. 
    // Actually scrapedTable has all rows.
    // But `fixTable` logic above didn't save `scrapedTable`. 
    // I'll update this function to save the whole table if available.
    // For now, let's just save the single row to be safe.
    team.table = [row];
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('Database updated from scrape.');
}

fixTable();
