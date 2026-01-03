const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const URL = 'https://www.football.org.il/team-details/team-table/?team_id=3586&season_id=27';

async function scrapeOfficialTable() {
    console.log('Launching browser (Stealth Mode)...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--lang=he-IL',
            '--window-size=1920,1080'
        ]
    });
    const page = await browser.newPage();

    // Randomize User Agent slightly or use a known good one
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    try {
        console.log(`Navigating to ${URL}...`);
        await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Check availability
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes('blocked') || bodyText.includes('security service')) {
            console.error('BLOCKED by WAF.');
            await browser.close();
            return;
        }

        // Wait for table
        try { await page.waitForSelector('table', { timeout: 10000 }); } catch (e) { }

        const rows = await page.evaluate(() => {
            const trs = Array.from(document.querySelectorAll('tr'));
            return trs.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()));
        });

        const myRow = rows.find(cells => {
            const name = cells[1] || '';
            return name.includes('בית"ר חיפה') || name.includes('ב.חיפה') || name.includes('יעקב');
        });

        if (myRow) {
            console.log('--- OFFICIAL ROW FOUND ---');
            const officialData = {
                position: myRow[0],
                team: myRow[1].replace('יעקב', '').trim(),
                games: myRow[2],
                wins: myRow[3],
                draws: myRow[4],
                losses: myRow[5],
                goals: myRow[6],
                points: myRow[myRow.length - 1]
            };

            console.log(`מיקום: ${officialData.position}, נקודות: ${officialData.points}`);

            const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            const idx = db.teams.findIndex(t => t.name === 'בוגרים');
            db.teams[idx].table = [officialData];
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            console.log('DB Updated.');
        } else {
            console.log('Row not found despite bypassing block.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

scrapeOfficialTable();
