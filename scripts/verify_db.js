const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

function checkTeam(teamName) {
    const team = db.teams.find(t => t.name === teamName);
    if (!team) {
        console.log(`Team ${teamName} not found!`);
        return;
    }
    console.log(`\n=== TEAM: ${teamName} ===`);

    // Check Table
    if (team.table) {
        console.log('--- Table (Last 3 Rows) ---');
        const len = team.table.length;
        const lastRows = team.table.slice(Math.max(0, len - 3));
        lastRows.forEach(r => console.log(JSON.stringify(r)));

        // Check for corruption
        const corruption = team.table.filter(r => r.position && (r.position.includes('/') || r.position.length > 3));
        if (corruption.length > 0) {
            console.error('!!! TABLE CORRUPTION DETECTED !!!', corruption);
        } else {
            console.log('✓ Table looks clean.');
        }
    } else {
        console.log('No table found.');
    }

    // Check Upcoming Games
    console.log('--- Upcoming Games (Next 3) ---');
    if (team.games) {
        const now = new Date();
        const parseDate = (d) => {
            const p = d.split('/');
            return new Date(p[2], p[1] - 1, p[0]);
        };

        const upcoming = team.games.filter(g => parseDate(g.date) >= now).slice(0, 3);
        upcoming.forEach(g => {
            console.log(`${g.date} | ${g.time} | Score: ${g.result_score} | Stadium: ${g.stadium}`);
        });
    }
}

checkTeam('בוגרים');
checkTeam('נוער');
