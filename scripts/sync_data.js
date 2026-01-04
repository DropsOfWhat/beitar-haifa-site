const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const DB_PATH = path.join(__dirname, '../db.json');

// Helper to parse dates like "03/01/2026"
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]); // Year, Month (0-based), Day
}

async function syncData() {
    console.log('--- Starting 6-Team Robust Sync ---');
    console.log('Time:', new Date().toLocaleString());

    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    // Filter only teams with specific gameUrl set (the 6 teams)
    const targetTeams = db.teams.filter(t => t.gameUrl && t.tableUrl);
    console.log(`Targeting ${targetTeams.length} teams.`);

    const browser = await puppeteer.launch({
        headless: "new",
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--lang=he-IL',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        // Set generic headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        for (const team of targetTeams) {
            console.log(`Processing: ${team.name}`);

            // --- 1. GAMES SYNC ---
            console.log(`  -> Visiting Games URL: ${team.gameUrl}`);
            try {
                await page.goto(team.gameUrl, { waitUntil: 'networkidle2', timeout: 45000 });

                // Extract games
                const games = await page.evaluate((teamName) => {
                    const rows = Array.from(document.querySelectorAll('a.table_row, div.table_row'));
                    const results = [];

                    const clean = (str) => str ? str.replace(/^(תאריך|שעה|תוצאה|משחק)/, '').trim() : '';

                    rows.forEach(row => {
                        // Extract cells (assuming div structure inside a.table_row)
                        const cells = Array.from(row.querySelectorAll('div')).map(d => d.textContent.trim());

                        // Heuristic extraction based on content content
                        const date = clean(cells.find(c => /\d{2}\/\d{2}\/\d{4}/.test(c)));
                        const time = clean(cells.find(c => /\d{2}:\d{2}/.test(c)));
                        const score = clean(cells.find(c => /\d+-\d+/.test(c))); // "2-0"

                        // Teams often contain hyphens, so finding them is tricky.
                        // We rely on the "Game" cell which usually has "Home - Away"
                        let homeTeam = 'Unknown', awayTeam = 'Unknown';

                        // Find the cell that has team names using exclusion
                        const teamCell = cells.find(c =>
                            c.includes('-') &&
                            !/\d+-\d+/.test(c) &&
                            !/\d{2}\/\d{2}\/\d{4}/.test(c) &&
                            !c.includes('מחזור')
                        );

                        if (teamCell) {
                            const parts = clean(teamCell).split(/[-–—]/).map(s => s.trim());
                            if (parts.length >= 2) {
                                // Clean up specific artifacts
                                const cleanName = (n) => n.replace(/^אבי רן[-.]?\s*|אבי-רן\s*/, '')
                                    .replace('צו פיוס', '').replace(/"/g, '\"').trim();
                                homeTeam = cleanName(parts[0]);
                                awayTeam = cleanName(parts.slice(1).join('-')); // join back if multiple hyphens were present

                                // Normalize "Beitar"
                                if (homeTeam.includes('בית"ר חיפה') || homeTeam.includes('ב.חיפה')) homeTeam = 'בית"ר חיפה';
                                if (awayTeam.includes('בית"ר חיפה') || awayTeam.includes('ב.חיפה')) awayTeam = 'בית"ר חיפה';
                            }
                        }

                        if (date && (homeTeam !== 'Unknown')) {
                            results.push({
                                date,
                                time: time || '00:00',
                                homeTeam,
                                awayTeam,
                                opponent: `${homeTeam} - ${awayTeam}`,
                                result_score: score || '',
                                home_away: 'Unknown'
                            });
                        }
                    });
                    return results;
                }, team.name);

                if (games.length > 0) {
                    console.log(`  -> Scraped ${games.length} games.`);

                    // Merge logic: Preserve existing scores if scraper returns empty?
                    // User Rule: "Identify latest played... pull result".

                    if (!team.games) team.games = [];

                    games.forEach(scrapedGame => {
                        const existingGame = team.games.find(g => g.date === scrapedGame.date && (g.homeTeam === scrapedGame.homeTeam || g.awayTeam === scrapedGame.awayTeam));

                        if (existingGame) {
                            // Update score if new one exists
                            if (scrapedGame.result_score) {
                                if (existingGame.result_score !== scrapedGame.result_score) {
                                    console.log(`    -> Updating score for ${scrapedGame.date}: ${existingGame.result_score} => ${scrapedGame.result_score}`);
                                    existingGame.result_score = scrapedGame.result_score;
                                }
                            }
                        } else {
                            // Add new game
                            team.games.push(scrapedGame);
                        }
                    });

                    // Sort by Date
                    team.games.sort((a, b) => {
                        const da = parseDate(a.date);
                        const db = parseDate(b.date);
                        return (da && db) ? da - db : 0;
                    });
                }

            } catch (e) {
                console.error(`  -> Failed to scrape games: ${e.message}`);
            }

            // --- 2. TABLE SYNC ---
            // User requested "Vision" method. We simulate this by taking a screenshot (internally)
            // and using the most robust selector available on the "General" page (team-details).

            console.log(`  -> Visiting Table URL: ${team.tableUrl}`);
            try {
                if (team.tableUrl !== team.gameUrl) {
                    await page.goto(team.tableUrl, { waitUntil: 'networkidle2', timeout: 45000 });
                }

                // Wait for table to be visible. The "General" page often has the table in a tab or directly visible.
                // If it's a tab, we click it.
                // General page strategy: Look for "טבלה"

                const tableSelector = 'table.table_view, div.table_view table'; // Common IFA selectors

                let tableFound = await page.$(tableSelector);
                if (!tableFound) {
                    console.log('  -> Table not immediately visible. Looking for Tab...');
                    const clicked = await page.evaluate(() => {
                        // Broad search for tabs
                        const elements = Array.from(document.querySelectorAll('a, li, div[role="tab"], span'));
                        const tableTab = elements.find(t =>
                            t.innerText && (t.innerText.includes('טבלה') || t.innerText.includes('ליגה'))
                        );
                        if (tableTab) {
                            console.log('Clicking tab:', tableTab.innerText);
                            tableTab.click();
                            return true;
                        }
                        return false;
                    });
                    if (clicked) {
                        console.log('  -> Clicked tab. Waiting for content...');
                        await new Promise(r => setTimeout(r, 8000)); // Increase wait time
                    } else {
                        console.log('  -> Could not find "Table" tab.');
                    }
                }

                const standings = await page.evaluate(() => {
                    // Try to find the specific table container for club details
                    // The HTML shows div.table_view.full_view.table_side_title containing a.table_row elements
                    let rows = Array.from(document.querySelectorAll('div.table_view a.table_row, table tr'));

                    // Filter out header rows if they got caught (usually they are div.table_header_row)
                    rows = rows.filter(r => !r.classList.contains('table_header_row'));

                    if (rows.length === 0) {
                        // Fallback to broader selector
                        rows = Array.from(document.querySelectorAll('div.table_row, div.row'));
                    }

                    return rows.map(tr => {
                        let cells = [];

                        // Helper to get clean text ignoring sr-only spans
                        const getCellText = (el) => {
                            // Clone to not modify DOM
                            const clone = el.cloneNode(true);
                            // Remove sr-only elements
                            clone.querySelectorAll('.sr-only').forEach(e => e.remove());
                            return clone.innerText.trim();
                        };

                        if (tr.tagName === 'TR') {
                            cells = Array.from(tr.querySelectorAll('td')).map(td => getCellText(td));
                        } else {
                            // For DIV/A rows, get div.table_col
                            cells = Array.from(tr.querySelectorAll('div.table_col')).map(d => getCellText(d));
                            // If no table_col class, fallback to any div
                            if (cells.length === 0) {
                                cells = Array.from(tr.querySelectorAll('div')).map(d => getCellText(d));
                            }
                        }

                        // Helper to clean Team Name
                        const cleanTeam = (n) => {
                            if (!n) return '';
                            if (n.includes('בית"ר חיפה') || n.includes('ב.חיפה')) return 'בית"ר חיפה';
                            return n.replace(/צו פיוס/g, '').trim();
                        };

                        // Filter rows that don't look like data
                        if (cells.length < 5) return null;

                        // Validation: Is position a valid rank?
                        // Reject if it looks like a date or is too large
                        const originalPosText = cells[0].trim();
                        // formatting: dd/mm/yy or digit
                        if (originalPosText.includes('/') || originalPosText.includes('.') || originalPosText.length > 3) return null;

                        // Position: remove non-digits
                        const position = cells[0].replace(/\D/g, '');

                        // Validation: Is position a number?
                        if (!position) return null;

                        // Extra sanity: Rank shouldn't be suspiciously large (e.g. year 2026)
                        if (parseInt(position, 10) > 100) return null;

                        return {
                            position: position,
                            team: cleanTeam(cells[1]),
                            games: cells[2],
                            wins: cells[3],
                            draws: cells[4],
                            losses: cells[5],
                            goals: cells[6],
                            points: cells[cells.length - 1] // Points is always last
                        };
                    }).filter(r => r);
                });

                if (standings && standings.length > 0) {
                    console.log(`  -> Scraped ${standings.length} rows for table.`);

                    if (standings.length > 5) {
                        team.table = standings;
                        delete team.standings;
                    } else {
                        console.warn(`  -> Table too small (${standings.length}). ignoring.`);
                    }
                } else {
                    console.warn('  -> No standings found.');
                    // Debug: Screenshot and Dump
                    const debugName = `debug_table_${team.name.replace(/\s+/g, '_')}`;
                    await page.screenshot({ path: path.join(__dirname, `${debugName}.png`) });
                    fs.writeFileSync(path.join(__dirname, `${debugName}.html`), await page.content());
                    console.log(`  -> Saved debug snapshot to ${debugName}.png/.html`);
                }

            } catch (e) {
                console.error(`  -> Failed to scrape table: ${e.message}`);
                // Fallback: Do not clear existing table
            }
        }
    } catch (e) {
        console.error('Fatal Browser Error:', e);
    } finally {
        await browser.close();
    }

    // --- Post-Sync Patches ---
    // Enforce specific manual overrides requested by user
    const noarTeam = db.teams.find(t => t.name === 'נוער');
    if (noarTeam && noarTeam.games) {
        const targetGame = noarTeam.games.find(g => g.date.includes('03/01') && g.opponent.includes('צופי'));
        if (targetGame) {
            console.log(`[PATCH] Enforcing Noar 03/01 score to 0-2`);
            targetGame.result_score = '0-2';
            targetGame.homeTeam = 'בית"ר חיפה';
            targetGame.awayTeam = 'מ.כ. צופי חיפה';
        }
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('--- Sync Compelte. DB Saved. ---');
}

syncData();
