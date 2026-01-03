const puppeteer = require('puppeteer');

async function findLeague() {
    console.log('Searching for League ID...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL']
    });
    const page = await browser.newPage();
    const url = 'https://www.football.org.il/team-details/team-games/?team_id=3586&season_id=27';

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(h => h.includes('league_id'));
        });

        console.log('League Links found:', links);

        if (links.length > 0) {
            const leagueUrl = links[0];
            console.log(`Navigating to League: ${leagueUrl}`);
            await page.goto(leagueUrl, { waitUntil: 'networkidle2' });

            try { await page.waitForSelector('table', { timeout: 5000 }); } catch (e) { }

            const rows = await page.evaluate(() => {
                const trs = Array.from(document.querySelectorAll('tr'));
                return trs.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()));
            });

            const myRow = rows.find(cells => {
                const name = cells[1] || '';
                return name.includes('בית"ר חיפה') || name.includes('ב.חיפה') || name.includes('יעקב');
            });

            if (myRow) {
                console.log('--- FOUND IN LEAGUE ---');
                console.log(JSON.stringify(myRow));
            } else {
                console.log('Not found in league table.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}
findLeague();
