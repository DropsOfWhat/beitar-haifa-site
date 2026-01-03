const puppeteer = require('puppeteer');

async function debugText() {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    const url = 'https://www.football.org.il/team-details/team-table/?team_id=3586&season_id=27';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const text = await page.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 500));
    await browser.close();
}
debugText();
