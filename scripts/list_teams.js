const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
db.teams.forEach(t => console.log(t.name));
