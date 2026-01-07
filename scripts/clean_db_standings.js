const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

function cleanDB() {
    console.log('--- Cleaning DB Standings ---');
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    let totalRemoved = 0;

    db.teams.forEach(team => {
        // Handle both 'table' and 'standings' properties just in case
        ['table', 'standings'].forEach(prop => {
            if (team[prop] && Array.isArray(team[prop])) {
                const originalLength = team[prop].length;

                team[prop] = team[prop].filter(row => {
                    // Filter criteria:
                    // 1. Position must exist
                    // 2. Position must be a number (1-20)
                    // 3. Position should NOT look like a date part (though regex \d+ handles this, 
                    //    conflicting date rows like "03" from "03/01/2026" usually come with other indicators)

                    // Specific check: corrupted rows often have a 'position' that was derived from a date, 
                    // AND they might have other fields that reveal they are games.
                    // But simpler: The corrupted rows had dates in the table. 
                    // Let's check if the row data looks valid.

                    // In the corrupted data, the scraper likely put the date in one of the cells.
                    // But the 'position' field in db.json for corrupted rows: 
                    // If the scraper used replace(/\D/g, ''), "03/01/2026" -> "03012026". 
                    // That is definitely not a valid rank (1-20).

                    if (!row.position) return false;

                    const posNum = parseInt(row.position, 10);
                    if (isNaN(posNum)) return false;

                    // Ranks are usually 1-16 (or roughly that range). 
                    // "03012026" is way larger.
                    // "17" is valid.

                    if (posNum > 100) return false; // Safe upper bound for a league table

                    return true;
                });

                const removed = originalLength - team[prop].length;
                if (removed > 0) {
                    console.log(`[${team.name}] Removed ${removed} invalid rows from '${prop}'.`);
                    totalRemoved += removed;
                }
            }
        });
    });

    if (totalRemoved > 0) {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log(`Saved DB. Total rows removed: ${totalRemoved}`);
    } else {
        console.log('No invalid rows found.');
    }
}

cleanDB();
