const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

function syncTableFromGames() {
    console.log('Syncing Adults Table from Official Game Records...');

    if (!fs.existsSync(DB_PATH)) return;
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const teamIndex = db.teams.findIndex(t => t.name === 'בוגרים');
    const team = db.teams[teamIndex];

    let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0, gamesPlayed = 0;

    team.games.forEach(g => {
        if (!g.result_score || !g.result_score.includes('-')) return;
        const parts = g.result_score.split('-').map(Number);

        let myScore, oppScore;
        // Determine side
        if (g.homeTeam.includes('בית"ר חיפה') || g.homeTeam.includes('ב.חיפה')) {
            myScore = parts[0];
            oppScore = parts[1];
        } else {
            myScore = parts[1];
            oppScore = parts[0];
        }

        gamesPlayed++;
        gf += myScore;
        ga += oppScore;

        if (myScore > oppScore) wins++;
        else if (myScore < oppScore) losses++;
        else draws++;
    });

    const points = (wins * 3) + (draws * 1);

    const officialRow = {
        position: "-", // Position cannot be calculated from single team games
        team: "בית\"ר חיפה",
        games: gamesPlayed.toString(),
        wins: wins.toString(),
        draws: draws.toString(),
        losses: losses.toString(),
        goals: `${gf}-${ga}`,
        points: points.toString()
    };

    db.teams[teamIndex].table = [officialRow];
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    console.log(`מיקום: ${officialRow.position}, נקודות: ${officialRow.points}`);
}

syncTableFromGames();
