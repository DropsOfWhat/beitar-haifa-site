const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeTable() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL']
    });
    const page = await browser.newPage();
    const url = 'https://www.football.org.il/team-details/team-table/?team_id=3586&season_id=27';

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // wait a bit
        await new Promise(r => setTimeout(r, 5000));

        const html = await page.content();
        fs.writeFileSync('page_dump.html', html);
        console.log('Dumped HTML to page_dump.html');

        // Search for keywords
        if (html.includes('בית"ר חיפה')) console.log('Found team name');
        if (html.includes('table_view')) console.log('Found table_view');

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

scrapeTable();
