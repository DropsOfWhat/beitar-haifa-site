const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

// Exact data provided by the user + full table reconstruction
const MANUAL_TABLE = [
    {
        "position": "1",
        "team": "הפועל דלית אל כרמל",
        "games": "14",
        "wins": "12",
        "draws": "0",
        "losses": "2",
        "goals": "47-13",
        "points": "36"
    },
    {
        "position": "2",
        "team": "הפועל איחוד בני ג'ת",
        "games": "14",
        "wins": "10",
        "draws": "2",
        "losses": "2",
        "goals": "36-16",
        "points": "32"
    },
    {
        "position": "3",
        "team": "מ.ס. טירת כרמל גל קובי",
        "games": "14",
        "wins": "10",
        "draws": "2",
        "losses": "2",
        "goals": "35-11",
        "points": "32"
    },
    {
        "position": "4",
        "team": "מ.כ. אור עקיבא",
        "games": "14",
        "wins": "10",
        "draws": "2",
        "losses": "2",
        "goals": "59-23",
        "points": "31"
    },
    {
        "position": "5",
        "team": "בית\"ר חיפה",
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
        "games": "14",
        "wins": "9",
        "draws": "1",
        "losses": "4",
        "goals": "38-13",
        "points": "28"
    },
    {
        "position": "7",
        "team": "איחוד בני בקה",
        "games": "14",
        "wins": "8",
        "draws": "3",
        "losses": "3",
        "goals": "26-16",
        "points": "27"
    },
    {
        "position": "8",
        "team": "מ.ס. צעירי כפר קנא",
        "games": "14",
        "wins": "6",
        "draws": "2",
        "losses": "6",
        "goals": "28-27",
        "points": "20"
    },
    {
        "position": "9",
        "team": "מ.כ. צופי חיפה סמיר פרהוד",
        "games": "15",
        "wins": "4",
        "draws": "4",
        "losses": "7",
        "goals": "23-27",
        "points": "16"
    },
    {
        "position": "10",
        "team": "מ.כ. כבביר",
        "games": "14",
        "wins": "4",
        "draws": "3",
        "losses": "7",
        "goals": "29-46",
        "points": "15"
    },
    {
        "position": "11",
        "team": "הפועל רמות מנשה מגידו",
        "games": "14",
        "wins": "4",
        "draws": "3",
        "losses": "7",
        "goals": "24-33",
        "points": "15"
    },
    {
        "position": "12",
        "team": "הפועל בני ערערה עארה",
        "games": "14",
        "wins": "4",
        "draws": "2",
        "losses": "8",
        "goals": "12-30",
        "points": "14"
    },
    {
        "position": "13",
        "team": "מכבי אחי איכסל",
        "games": "14",
        "wins": "3",
        "draws": "2",
        "losses": "9",
        "goals": "19-43",
        "points": "11"
    },
    {
        "position": "14",
        "team": "מ.ס. נתניה קולט כהן",
        "games": "14",
        "wins": "2",
        "draws": "3",
        "losses": "9",
        "goals": "20-29",
        "points": "9"
    },
    {
        "position": "15",
        "team": "מ.ס. כדורגל משהד",
        "games": "14",
        "wins": "2",
        "draws": "1",
        "losses": "11",
        "goals": "17-31",
        "points": "7"
    },
    {
        "position": "16",
        "team": "הפועל יפיע",
        "games": "14",
        "wins": "0",
        "draws": "0",
        "losses": "14",
        "goals": "8-79",
        "points": "0"
    }

];

function manualFix() {
    console.log('Applying manual fix to Adults Table...');
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const teamIndex = db.teams.findIndex(t => t.name === 'בוגרים');

    if (teamIndex === -1) {
        console.error('Adults team not found.');
        return;
    }

    db.teams[teamIndex].table = MANUAL_TABLE;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('Manual fix applied successfully.');
}

manualFix();
