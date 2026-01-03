const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

['נערים ג ארצית', 'נוער'].forEach(name => {
    const t = db.teams.find(x => x.name === name);
    if (!t) { console.log(name + ' not found'); return; }
    const g = t.games.find(x => x.date.includes('03/01'));
    if (!g) { console.log(name + ' game not found'); return; }
    console.log(`Team: ${name}`);
    console.log(`  Home: ${g.homeTeam}`);
    console.log(`  Away: ${g.awayTeam}`);
    console.log(`  Score: ${g.result_score}`);
});
