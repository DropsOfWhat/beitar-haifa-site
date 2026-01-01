const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

if (db.teams && db.teams.length > 0) {
    const removedTeam = db.teams.shift(); // Remove the first element
    console.log(`Removed team: ${removedTeam.name}`);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
} else {
    console.log('No teams to remove.');
}
