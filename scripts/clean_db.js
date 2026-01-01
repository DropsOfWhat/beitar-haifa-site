const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function cleanString(str) {
    if (!str) return str;
    // Common labels to strip
    const labels = [
        'תאריך', 'שעה', 'תוצאה', 'מחזור', 'משחק', 'אצטדיון', // Match fields
        'מקום', 'קבוצה', 'מש\'', 'נצ\'', 'תיקו', 'הפ\'', 'שע\'', 'נק\'' // Table fields (with ' which might be encoded)
    ];

    let cleaned = str;
    labels.forEach(label => {
        if (cleaned.startsWith(label)) {
            cleaned = cleaned.replace(label, '');
        }
    });
    return cleaned.trim();
}

db.teams.forEach(team => {
    // Clean Basic Info if needed (seems ok in JSON, but name had \n)
    if (team.name) {
        team.name = team.name.replace(/קבוצה/g, '').replace(/[\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Clean Games
    if (team.games) {
        team.games.forEach(game => {
            game.date = cleanString(game.date);
            game.time = cleanString(game.time);
            game.result_score = cleanString(game.result_score);
            if (game.opponent) {
                game.opponent = game.opponent.replace('משחק', '').replace('תוצאה', '').trim();
            }
            if (game.homeTeam) {
                game.homeTeam = game.homeTeam.replace('משחק', '').replace('קבוצה', '').trim();
            }
            if (game.awayTeam) {
                game.awayTeam = game.awayTeam.replace('משחק', '').replace('קבוצה', '').trim();
            }
        });
    }

    // Clean Table
    if (team.table) {
        team.table.forEach(row => {
            row.position = cleanString(row.position);
            row.team = cleanString(row.team);
            row.games = cleanString(row.games);
            row.wins = cleanString(row.wins);
            row.draws = cleanString(row.draws);
            row.losses = cleanString(row.losses);
            row.goals = cleanString(row.goals);
            row.points = cleanString(row.points);
        });
    }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Database cleaned successfully.');
