const puppeteer = require('puppeteer');

async function scrapeTable() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL', '--start-maximized']
    });
    const page = await browser.newPage();
    const url = 'https://www.football.org.il/team-details/team-table/?team_id=3586&season_id=27';

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        const result = await page.evaluate(() => {
            // Find deep text match
            const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            const matches = [];
            while (node = treeWalker.nextNode()) {
                if (node.nodeValue.includes('בית"ר חיפה') || node.nodeValue.includes('ב.חיפה') || node.nodeValue.includes('יעקב')) {
                    matches.push({
                        text: node.nodeValue,
                        parentTag: node.parentElement.tagName,
                        parentClass: node.parentElement.className,
                        ancestorHTML: node.parentElement.parentElement.parentElement.outerHTML.substring(0, 500)
                    });
                }
            }
            return matches;
        });

        console.log('Matches found:', result.length);
        if (result.length > 0) {
            console.log(JSON.stringify(result[0], null, 2));
            // Check if any match looks like a table row (has multiple TD siblings or similar)
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

scrapeTable();
