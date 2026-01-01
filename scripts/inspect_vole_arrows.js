const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://vole.one.co.il/league/1169', { waitUntil: 'networkidle2' });

    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('li'));
        const gamesTab = tabs.find(el => el.innerText.includes('משחקים'));
        if (gamesTab) gamesTab.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    const analysis = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const roundEls = elements.filter(el => el.innerText && el.innerText.includes('מחזור') && el.children.length < 5);

        return roundEls.map(el => ({
            tag: el.tagName,
            text: el.innerText.substring(0, 50),
            class: el.className,
            parentClass: el.parentElement ? el.parentElement.className : 'null'
        })).slice(0, 5);
    });

    console.log('Round Elements:', JSON.stringify(analysis, null, 2));
    await browser.close();
})();
