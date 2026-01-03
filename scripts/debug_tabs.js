const puppeteer = require('puppeteer');

async function debugTabs() {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    const url = 'https://www.football.org.il/team-details/?team_id=3586&season_id=27';
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Dump all links/clickable text
    const clickables = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a, li, div, span, button'))
            .map(e => e.innerText.trim())
            .filter(t => t.length > 0 && t.length < 20);
    });

    // console.log(clickables.join('\n'));
    if (clickables.includes('טבלה')) console.log('FOUND "טבלה" text element.');
    else console.log('DID NOT FIND "טבלה" text element.');

    await browser.close();
}
debugTabs();
