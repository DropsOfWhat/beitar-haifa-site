const db = require('../db.json');
const noar = db.teams.find(t => t.name === 'נוער');
const table = noar.table || noar.standings;
if (table && table.length > 0) {
    console.log('Last 2 rows of Noar table:');
    console.log(JSON.stringify(table.slice(-2), null, 2));
} else {
    console.log('Noar table is empty.');
}
