const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

console.log('Applying manual updates...');

// 1. Ne'arim Gimel Mifratz
const mifratz = db.teams.find(t => t.name === 'נערים ג מפרץ');
if (mifratz) {
    const game = mifratz.games.find(g => g.date.startsWith('03/01'));
    if (game) {
        if (game.homeTeam.includes('בית"ר') || game.homeTeam.includes('חיפה') && !game.homeTeam.includes('טירת')) {
            // Beitar is Home (likely). Win = 2-0.
            // Double check: if homeTeam is Beitar Haifa
            if (game.homeTeam.includes('בית"ר')) {
                game.result_score = '2-0';
                console.log(`Mifratz: Set 2-0 (Home Win) for ${game.homeTeam} vs ${game.awayTeam}`);
            } else {
                // Maybe Beitar is Away?
                game.result_score = '0-2';
                console.log(`Mifratz: Set 0-2 (Away Win - assumed) for ${game.homeTeam} vs ${game.awayTeam}`);
            }
        } else {
            // Beitar Away
            game.result_score = '0-2';
            console.log(`Mifratz: Set 0-2 (Away Win) for ${game.homeTeam} vs ${game.awayTeam}`);
        }
    } else {
        console.error('Mifratz: Game on 03/01 not found');
    }
} else {
    console.error('Team Ne\'arim Gimel Mifratz not found');
}

// 2. Ne'arim Gimel Artzit
const artzit = db.teams.find(t => t.name === 'נערים ג ארצית');
if (artzit) {
    const game = artzit.games.find(g => g.date.startsWith('03/01'));
    if (game) {
        // User said "Zur Shalom 0-2 Beitar (Victory for Beitar)"
        if (game.homeTeam.includes('בית"ר')) {
            game.result_score = '2-0'; // Beitar Home Win
            console.log(`Artzit: Set 2-0 (Home Win) for ${game.homeTeam} vs ${game.awayTeam}`);
        } else {
            game.result_score = '0-2'; // Beitar Away Win
            console.log(`Artzit: Set 0-2 (Away Win) for ${game.homeTeam} vs ${game.awayTeam}`);
        }
    } else {
        console.error('Artzit: Game on 03/01 not found');
    }
}

// 3. Noar
const noar = db.teams.find(t => t.name === 'נוער');
if (noar) {
    const game = noar.games.find(g => g.date.startsWith('03/01'));
    if (game) {
        // User said "0-2 Beitar (Victory)"
        if (game.homeTeam.includes('בית"ר')) {
            game.result_score = '2-0'; // Beitar Home Win
            console.log(`Noar: Set 2-0 (Home Win) for ${game.homeTeam} vs ${game.awayTeam}`);
        } else {
            game.result_score = '0-2'; // Beitar Away Win
            console.log(`Noar: Set 0-2 (Away Win) for ${game.homeTeam} vs ${game.awayTeam}`);
        }
    } else {
        console.error('Noar: Game on 03/01 not found');
    }
}

// 4. Yeladim A Sharon
const yeladimA = db.teams.find(t => t.name === 'ילדים א שרון');
if (yeladimA) {
    const game = yeladimA.games.find(g => g.date.startsWith('03/01'));
    if (game) {
        game.result_score = '2-2';
        console.log(`Yeladim A: Set 2-2 for ${game.homeTeam} vs ${game.awayTeam}`);
    } else {
        console.error('Yeladim A: Game on 03/01 not found');
    }
}

// 5. Adults Table
const bogrim = db.teams.find(t => t.name === 'בוגרים');
if (bogrim) {
    const updatePoints = (pos, pts) => {
        const row = bogrim.table.find(r => r.position.toString() === pos.toString());
        if (row) {
            row.points = pts.toString();
        } else {
            console.warn(`Row ${pos} not found in Adults table`);
        }
    };

    updatePoints(1, 39);
    updatePoints(2, 35);
    updatePoints(3, 35);
    updatePoints(4, 31);
    updatePoints(16, 0);

    // Beitar
    const beitarSearch = bogrim.table.find(r => r.team.includes('בית"ר'));
    const beitar = beitarSearch || bogrim.table.find(r => r.position === '5');

    if (beitar) {
        beitar.position = '5';
        beitar.team = 'בית"ר חיפה'; // Ensure name
        beitar.games = '15';
        beitar.wins = '10';
        beitar.draws = '0';
        beitar.losses = '5';
        beitar.goals = '40-24';
        beitar.points = '30';
        console.log('Updated Adults Beitar stats');
    } else {
        console.error('Beitar not found in Adults table');
    }
}

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log('db.json updated.');
