const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

if (!fs.existsSync(DB_PATH)) {
    console.error('db.json not found');
    process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const dateToCheck = '03/01'; // Date string part

console.log('--- Verifying Data for 03/01/2026 ---');

let checksPassed = true;

// 1. Check Noar
const noar = db.teams.find(t => t.name === 'נוער');
const noarGame = noar ? noar.games.find(g => g.date.includes(dateToCheck)) : null;

if (noarGame) {
    console.log(`[PASS] Noar Game Found: ${noarGame.homeTeam} vs ${noarGame.awayTeam} | ${noarGame.result_score}`);
    if (noarGame.result_score !== '2-0' || !noarGame.homeTeam.includes('בית"ר')) {
        console.error('  [FAIL] Noar score/teams verification failed! Expected Beitar Home 2-0.');
        checksPassed = false;
    }
} else {
    console.error('[FAIL] Noar Game NOT found for 03/01');
    checksPassed = false;
}

// 2. Check Ne'arim Gimel Artzit
const artzit = db.teams.find(t => t.name.includes('ארצית'));
const artzitGame = artzit ? artzit.games.find(g => g.date.includes(dateToCheck)) : null;

if (artzitGame) {
    console.log(`[PASS] Artzit Game Found: ${artzitGame.homeTeam} vs ${artzitGame.awayTeam} | ${artzitGame.result_score}`);
    if (artzitGame.result_score !== '2-0' || !artzitGame.homeTeam.includes('בית"ר')) {
        console.warn('  [WARN] Artzit Game details might differ from manual expectation. Please check.');
    }
} else {
    console.error('[FAIL] Artzit Game NOT found for 03/01');
    checksPassed = false;
}

// 3. Check Adults Table Integrity
const bogrim = db.teams.find(t => t.name === 'בוגרים');
if (bogrim && bogrim.table) {
    const beitarSearch = bogrim.table.find(r => r.team.includes('בית"ר') || r.team.includes('טירת כרמל'));
    // Just finding *some* rows to ensure not empty
    if (bogrim.table.length > 10) {
        console.log(`[PASS] Adults table has ${bogrim.table.length} rows.`);

        const beitar = bogrim.table.find(r => r.team.includes('בית"ר'));
        if (beitar) {
            console.log(`[INFO] Adults Beitar Stats: Rank ${beitar.position}, Pts ${beitar.points}`);
            if (beitar.points === '30') {
                console.log('[PASS] Adults points integrity verified (30 pts).');
            } else {
                console.warn(`[WARN] Adults points mismatch! Expected 30, got ${beitar.points}. Scraper might have overwritten manual data with bad data?`);
            }
        }
    } else {
        console.error(`[FAIL] Adults table seems empty or too small (${bogrim.table.length} rows)`);
        checksPassed = false;
    }
} else {
    console.error('[FAIL] Adults table missing');
    checksPassed = false;
}

console.log('---------------------------------------');
if (checksPassed) {
    console.log('VERIFICATION SUCCESSFUL');
    process.exit(0);
} else {
    console.log('VERIFICATION FAILED');
    process.exit(1);
}
