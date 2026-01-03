const puppeteer = require('puppeteer');

async function debugHTML() {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--lang=he-IL'] });
    const page = await browser.newPage();
    const url = 'https://www.football.org.il/team-details/?team_id=3586&season_id=27';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const html = await page.content();

    // Check for "טבלה" in the raw HTML
    if (html.includes('טבלה')) {
        console.log('Word "טבלה" exists in HTML source.');
        // Find selector near it
    } else {
        console.log('Word "טבלה" DOES NOT exist in HTML source.');
    }

    const navItems = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('ul li a')).map(a => a.innerText);
    });
    console.log('Nav items:', navItems);

    await browser.close();
}
debugHTML();
