const https = require('https');

const url = 'https://www.football.org.il/team-details/team-table/?team_id=3586&season_id=27';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Data received, length:', data.length);
        if (data.includes('בית"ר חיפה')) {
            console.log('Found team name in RAW HTML!');
        } else {
            console.log('Did NOT find team name in RAW HTML.');
        }

        // Try to find row structure
        // Look for Position
        const regex = /<tr[^>]*>[\s\S]*?בית"ר חיפה[\s\S]*?<\/tr>/i;
        const match = data.match(regex);
        if (match) {
            console.log('Regex Match Found:');
            console.log(match[0]);
        } else {
            // Check for div-based
            // This is harder with regex, but let's check for table-like structure
            if (data.includes('table_view')) {
                console.log('Contains table_view class.');
            }
        }
    });
}).on('error', (e) => {
    console.error(e);
});
