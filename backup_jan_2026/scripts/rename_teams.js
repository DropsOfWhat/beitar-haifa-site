const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Helper to determine Age Group
function getAgeGroup(name) {
    if (name.includes('בוגרים')) return 'בוגרים';
    if (name.includes('נוער')) return 'נוער';
    if (name.includes('נערים א')) return 'נערים א';
    if (name.includes('נערים ב')) return 'נערים ב';
    if (name.includes('נערים ג')) return 'נערים ג';
    if (name.includes('טרום ילדים א')) return 'טרום ילדים א'; // Check long first
    if (name.includes('טרום ילדים ב')) return 'טרום ילדים ב';
    if (name.includes('טרום ילדים ג')) return 'טרום ילדים ג';
    if (name.includes('ילדים א')) return 'ילדים א';
    if (name.includes('ילדים ב')) return 'ילדים ב';
    if (name.includes('ילדים ג')) return 'ילדים ג';
    return null;
}

const seenNames = new Set();

db.teams.forEach(team => {
    const originalName = team.name;
    const ageGroup = getAgeGroup(originalName);

    let newName = originalName;

    if (ageGroup === 'בוגרים') {
        newName = 'בוגרים - בית"ר חיפה יעקב';
    } else if (ageGroup === 'נוער') {
        newName = 'נוער - בית"ר חיפה - אבי רן';
    } else if (ageGroup) {
        // Youth/Children format: "[Age Group] - בית\"ר חיפה"
        newName = `${ageGroup} - בית"ר חיפה`;

        // Handle duplicates / variants
        // Check for specific distinguishing markers ONLY if necessary or if it helps clarity?
        // User asked for CLEAN format. But duplications are broken.
        // If original name had "2", append "2".
        if (originalName.includes(' 2') || originalName.includes('2 ')) { // crude check
            newName += ' 2';
        }
    }

    // Collision check
    if (seenNames.has(newName)) {
        // If we have a collision and didn't add '2', try adding it or something?
        // Or if it matches exactly, maybe it IS the same team appearing twice? (Unlikely)
        // Let's force unique by appending if needed.
        let counter = 2;
        while (seenNames.has(`${newName} ${counter}`)) {
            counter++;
        }
        // Actually, if we already have "Nearing G - Beitar Haifa", next one should be "Nearing G - Beitar Haifa 2" 
        // unless it already has 2.
        if (!newName.endsWith(' 2')) {
            newName = `${newName} 2`; // Simple heuristic for now
        } else {
            newName = `${newName} (${counter})`; // Fallback
        }
    }

    seenNames.add(newName);
    team.name = newName;
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Teams renamed successfully.');
