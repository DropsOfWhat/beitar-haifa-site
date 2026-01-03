const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../db.json'), 'utf8'));
const team = db.teams.find(t => t.name === 'בוגרים');

let wins = 0;
let draws = 0;
let losses = 0;
let goalsFor = 0;
let goalsAgainst = 0;

team.games.forEach(g => {
    if (g.result_score && g.result_score.includes('-')) {
        const parts = g.result_score.split('-').map(Number);
        // We need to know who is home info. 
        // Logic in sync_data.js was: homeTeam = parts[0], awayTeam = parts[1]
        // result_score is Home-Away

        let myScore, oppScore;
        const myName = "בית\"ר חיפה";

        // Heuristic: Check team names in game object
        // But sync_data sometimes fails to set home_away perfectly or sets 'Unknown'.
        // However, we scraped 'homeTeam' and 'awayTeam'.

        if (g.homeTeam.includes(myName) || g.homeTeam.includes('ב.חיפה')) {
            myScore = parts[0];
            oppScore = parts[1];
        } else if (g.awayTeam.includes(myName) || g.awayTeam.includes('ב.חיפה')) {
            myScore = parts[1];
            oppScore = parts[0];
        } else {
            console.log('Skipping game (unknown side):', g.opponent);
            return;
        }

        goalsFor += myScore;
        goalsAgainst += oppScore;

        if (myScore > oppScore) wins++;
        else if (myScore < oppScore) losses++;
        else draws++;
    }
});

const points = (wins * 3) + (draws * 1);
console.log(`Calculated from Games: ${wins} W, ${draws} D, ${losses} L`);
console.log(`Points: ${points}`);
console.log(`Goals: ${goalsFor}-${goalsAgainst}`);

if (team.table && team.table.length > 0) {
    console.log('Table in DB:', JSON.stringify(team.table[0], null, 2));
} else {
    console.log('No table in DB');
}
