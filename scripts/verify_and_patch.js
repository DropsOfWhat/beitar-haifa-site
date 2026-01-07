const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

console.log('--- Verifying & Patching Data for 03/01/2026 ---');
let modified = false;

// 1. Fix Noar
const noar = db.teams.find(t => t.name === 'נוער');
if (noar) {
    const game = noar.games.find(g => g.date.includes('03/01'));
    if (game) {
        // Enforce: Beitar (Home) 2-0 Tzofei (Away)
        const expectedScore = '2-0';
        const expectedHome = 'בית"ר חיפה';

        if (game.result_score !== expectedScore || !game.homeTeam.includes('בית"ר')) {
            console.log(`[PATCH] Fixing Noar game. Was: ${game.homeTeam} vs ${game.awayTeam} (${game.result_score})`);
            game.homeTeam = 'בית"ר חיפה';
            game.awayTeam = 'מ.כ. צופי חיפה';
            game.opponent = 'בית"ר חיפה - מ.כ. צופי חיפה';
            game.result_score = '2-0';
            modified = true;
        } else {
            console.log(`[OK] Noar verified.`);
        }
    }
}

// 2. Fix Ne'arim Gimel Artzit
const artzit = db.teams.find(t => t.name.includes('ארצית'));
if (artzit) {
    const game = artzit.games.find(g => g.date.includes('03/01'));
    if (game) {
        // Enforce: Beitar (Home) 2-0 Zur Shalom (Away)
        // Note: Earlier user said Zur Shalom 0-2 Beitar (Beitar Away).
        // Let's re-read step 0 request: "מ.כ. צור שלום 0-2 בית"ר חיפה (ניצחון לבית"ר)." -> Beitar is AWAY.

        const expectedScore = '0-2';
        // If Beitar is Away, score 0-2 is correct.

        // Check if scraper messed up Home/Away or Score
        if (game.result_score !== '0-2' && game.result_score !== '2-0') {
            console.log(`[PATCH] Fixing Artzit score. Was: ${game.result_score}`);
            game.result_score = '0-2';
            modified = true;
        }
    }
}

// 3. Fix Yeladim A Sharon
const yeladimA = db.teams.find(t => t.name.includes('ילדים א שרון'));
if (yeladimA) {
    const game = yeladimA.games.find(g => g.date.includes('03/01'));
    if (game) {
        // User request: "Maccabi Haifa Gold... 2-2 Beitar Haifa"
        if (game.result_score !== '2-2') {
            console.log(`[PATCH] Fixing Yeladim A score. Was: ${game.result_score}`);
            game.result_score = '2-2';
            modified = true;
        }
    }
}

if (modified) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('--- Database Patched & Saved ---');
} else {
    console.log('--- No Patches Needed ---');
}
