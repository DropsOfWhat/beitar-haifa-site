const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.teams.forEach((t, i) => console.log(`${i}: ${t.name} - ${t.url}`));
