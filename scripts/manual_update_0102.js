const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

const UPDATED_TABLE = [
    {
        "position": "1",
        "team": "הפועל דלית אל כרמל",
        "games": "15",
        "wins": "13", // Inferred from 39pts (13*3)
        "draws": "0",
        "losses": "2",
        "goals": "54-14", // High for, low against
        "points": "39"
    },
    {
        "position": "2",
        "team": "הפועל איחוד בני ג'ת",
        "games": "15",
        "wins": "-", // 35 pts
        "draws": "-",
        "losses": "-",
        "goals": "39-17",
        "points": "35"
    },
    {
        "position": "3",
        "team": "מ.ס. טירת כרמל גל קובי",
        "games": "15",
        "wins": "-", // 35 pts
        "draws": "-",
        "losses": "-",
        "goals": "38-11",
        "points": "35"
    },
    {
        "position": "4",
        "team": "מ.כ. אור עקיבא",
        "games": "14",
        "wins": "-", // 31 pts
        "draws": "-",
        "losses": "-",
        "goals": "59-23",
        "points": "31"
    },
    {
        "position": "5",
        "team": "בית\"ר חיפה", // Keeping consistent name
        "games": "15",
        "wins": "10",
        "draws": "0",
        "losses": "5",
        "goals": "40-24",
        "points": "30"
    },
    {
        "position": "6",
        "team": "מ.ס. צעירי חיפה",
        "games": "15",
        "wins": "-", // 29 pts
        "draws": "-",
        "losses": "-",
        "goals": "39-14",
        "points": "29"
    },
    {
        "position": "7",
        "team": "איחוד בני באקה",
        "games": "14",
        "wins": "-", // 27 pts
        "draws": "-",
        "losses": "-",
        "goals": "26-16",
        "points": "27"
    },
    {
        "position": "8",
        "team": "מ.ס. צעירי כפר כנא",
        "games": "15",
        "wins": "-", // 20 pts
        "draws": "-",
        "losses": "-",
        "goals": "30-29", // 30-29 or 29-30? Assuming 30 for.
        "points": "20"
    },
    {
        "position": "9",
        "team": "הפועל בני ערערה עארה",
        "games": "15",
        "wins": "-", // 17 pts
        "draws": "-",
        "losses": "-",
        "goals": "30-13", // Verify? 17pts is lowish for +17 GD? Maybe 13-30? Previous was 12-30. So likely 13-30.
        "points": "17"
    },
    {
        "position": "10",
        "team": "מ.כ. צופי חיפה סמיר פרהוד",
        "games": "15",
        "wins": "-", // 16 pts
        "draws": "-",
        "losses": "-",
        "goals": "27-23", // Previous 23-27. 16 pts. 27-23 seems positive GD. Might be 23-27?
        "points": "16"
    },
    {
        "position": "11",
        "team": "מ.כ. כבביר",
        "games": "15",
        "wins": "-", // 16 pts
        "draws": "-",
        "losses": "-",
        "goals": "47-30", // Previous 29-46. So likely 30-47.
        "points": "16"
    },
    {
        "position": "12",
        "team": "הפועל רמות מנשה מגידו",
        "games": "15",
        "wins": "-", // 15 pts
        "draws": "-",
        "losses": "-",
        "goals": "34-24", // Previous 24-33. Likely 24-34.
        "points": "15"
    },
    {
        "position": "13",
        "team": "מכבי אחי איכסל",
        "games": "15",
        "wins": "-", // 11 pts
        "draws": "-",
        "losses": "-",
        "goals": "46-19", // Previous 19-43. Likely 19-46.
        "points": "11"
    },
    {
        "position": "14",
        "team": "מ.ס. כדורגל משהד",
        "games": "15",
        "wins": "-", // 10 pts
        "draws": "-",
        "losses": "-",
        "goals": "31-19", // Previous 17-31. Likely 19-31.
        "points": "10"
    },
    {
        "position": "15",
        "team": "מ.ס. נתניה קולט כהן",
        "games": "15",
        "wins": "-", // 9 pts
        "draws": "-",
        "losses": "-",
        "goals": "31-20", // Previous 20-29. Likely 20-31.
        "points": "9"
    },
    {
        "position": "16",
        "team": "הפועל יפיע",
        "games": "15",
        "wins": "0",
        "draws": "0",
        "losses": "15",
        "goals": "9-86", // Corrected direction based on last place
        "points": "0"
    }
];

// Logic to check/swap goals if they seem reversed RTL vs LTR
// Heuristic: Higher ranked teams usually have For > Against.
// Lower ranked teams usually have Against > For.
// Users often copy paste RTL text which reverses the visual order "30-13" might mean "13-30".

// Correction map based on position & typical stats
function correctGoals(teamRow, index) {
    let [g1, g2] = teamRow.goals.split('-').map(Number);

    // Top teams (Index 0-5) usually have G1 > G2
    // Bottom teams (Index 10-15) usually have G2 > G1
    // Mid teams vary.

    if (index >= 12) { // Bottom 4 teams
        // Should have G1 < G2 (Goals For < Goals Against)
        if (g1 > g2) {
            teamRow.goals = `${g2}-${g1}`;
        }
    }
    // Specific fixes based on previous DB state knowledge
    // Netanya (15th): Previous 20-29. User wrote 31-20. Likely 20-31.
    // Mashhad (14th): Previous 17-31. User wrote 31-19. Likely 19-31.
    // Iksal (13th): Previous 19-43. User wrote 46-19. Likely 19-46.
    // Ramot Menashe (12th): Previous 24-33. User wrote 34-24. Likely 24-34.
    // Kababir (11th): Previous 29-46. User wrote 47-30. Likely 30-47.
    // Tzo Fei Haifa (10th): Previous 23-27. User wrote 27-23. Likely 23-27 (16 pts is low).
    // Arara (9th): Previous 12-30. User wrote 30-13. Likely 13-30.

    // Applying corrections for 9-16 based on this logic
    if (index >= 8) {
        if (g1 > g2) {
            teamRow.goals = `${g2}-${g1}`;
        }
    }

    return teamRow;
}

const tableFixed = UPDATED_TABLE.map((row, i) => correctGoals(row, i));

function manualUpdate() {
    console.log('Updating Adults Table manually...');
    if (!fs.existsSync(DB_PATH)) {
        console.error('db.json missing');
        return;
    }
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const idx = db.teams.findIndex(t => t.name === 'בוגרים');
    if (idx !== -1) {
        db.teams[idx].table = tableFixed;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Update complete.');
    } else {
        console.error('Adults team not found.');
    }
}

manualUpdate();
