import fs from 'fs';
import path from 'path';

export interface Game {
    date: string;
    time: string;
    result_score: string;
    home_away: string;
    opponent: string;
    homeTeam: string;
    awayTeam: string;
    _teamName?: string; // Enhanced with team identifier
    _parsedDate?: Date; // For sorting
}

export interface Team {
    name: string;
    url: string;
    games: Game[];
    table?: any[];
}

export interface DB {
    teams: Team[];
}

export async function getUnifiedGames() {
    const filePath = path.join(process.cwd(), 'db.json');
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data: DB = JSON.parse(fileContents);

        let allUpcomingGames: Game[] = [];
        let allRecentResults: Game[] = [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (data.teams) {
            data.teams.forEach((team) => {
                if (team.games) {
                    // Process all games for the current team
                    const teamGames = team.games.map((g) => {
                        const [day, month, year] = g.date.split('/').map(Number);
                        const parsedDate = new Date(year, month - 1, day);
                        if (g.time) {
                            const [hours, minutes] = g.time.split(':').map(Number);
                            if (!isNaN(hours) && !isNaN(minutes)) {
                                parsedDate.setHours(hours, minutes);
                            }
                        }
                        return {
                            ...g,
                            _teamName: team.name,
                            _parsedDate: parsedDate
                        };
                    });

                    // Sort team specific games
                    teamGames.sort((a, b) => {
                        if (!a._parsedDate || !b._parsedDate) return 0;
                        return a._parsedDate.getTime() - b._parsedDate.getTime();
                    });

                    // Split into upcoming and past for this specific team
                    const teamUpcoming = teamGames.filter(g => g._parsedDate && g._parsedDate >= now);
                    const teamPast = teamGames.filter(g => g._parsedDate && g._parsedDate < now);

                    // Add ONLY the first upcoming game (the next one) to the global upcoming list
                    if (teamUpcoming.length > 0) {
                        allUpcomingGames.push(teamUpcoming[0]);
                    }

                    // Sort past games descending (newest first) to find the most recent result
                    teamPast.sort((a, b) => {
                        if (!a._parsedDate || !b._parsedDate) return 0;
                        return b._parsedDate.getTime() - a._parsedDate.getTime();
                    });

                    // Add ONLY the latest result to the global recent list
                    if (teamPast.length > 0) {
                        allRecentResults.push(teamPast[0]);
                    }
                }
            });
        }

        // Sort the global lists

        // Upcoming: Ascending (closest to now first)
        allUpcomingGames.sort((a, b) => {
            if (!a._parsedDate || !b._parsedDate) return 0;
            return a._parsedDate.getTime() - b._parsedDate.getTime();
        });

        // Recent: Descending (newest first)
        allRecentResults.sort((a, b) => {
            if (!a._parsedDate || !b._parsedDate) return 0;
            return b._parsedDate.getTime() - a._parsedDate.getTime();
        });


        return {
            upcomingGames: allUpcomingGames,
            recentResults: allRecentResults
        };

    } catch (error) {
        console.error("Error reading or parsing db.json:", error);
        return { upcomingGames: [], recentResults: [] };
    }
}
