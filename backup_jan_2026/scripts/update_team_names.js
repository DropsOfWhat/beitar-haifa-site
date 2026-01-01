const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const nameMapping = {
    'בוגרים - בית"ר חיפה יעקב': 'בוגרים',
    'נוער - בית"ר חיפה - אבי רן': 'נוער',
    'נערים א - בית"ר חיפה 2': 'נערים א',
    'נערים ב - בית"ר חיפה 2': 'נערים ב',
    'נערים ג - בית"ר חיפה 2': 'נערים ג ארצית',
    'נערים ג - בית"ר חיפה': 'נערים ג מפרץ',
    'ילדים א - בית"ר חיפה 2': 'ילדים א שרון',
    'ילדים א - בית"ר חיפה 2 (2)': 'ילדים א מפרץ',
    'ילדים ב - בית"ר חיפה 2': 'ילדים ב',
    'ילדים ג - בית"ר חיפה': 'ילדים ג',
    'טרום ילדים א - בית"ר חיפה 2': 'טרום א חוף',
    'טרום ילדים א - בית"ר חיפה 2 (2)': 'טרום א מפרץ',
    'טרום ילדים ב - בית"ר חיפה': 'טרום ב חוף 1',
    'טרום ילדים ב - בית"ר חיפה 2': 'טרום ב חוף'
};

let changesCount = 0;

db.teams.forEach(team => {
    if (nameMapping[team.name]) {
        console.log(`Renaming: "${team.name}" -> "${nameMapping[team.name]}"`);
        team.name = nameMapping[team.name];
        changesCount++;
    } else {
        console.log(`No change for: "${team.name}"`);
    }
});

if (changesCount > 0) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log(`\nSuccessfully updated ${changesCount} team names.`);
} else {
    console.log('\nNo changes made.');
}
