import React from 'react';

interface TableRow {
    position: number;
    team: string;
    games: number;
    wins: number;
    draws: number;
    losses: number;
    goals: string;
    points: number;
}

interface LeagueTableProps {
    table: TableRow[];
}

export default function LeagueTable({ table }: LeagueTableProps) {
    if (!table || table.length === 0) {
        return <div className="text-center text-gray-500 py-8">טבלה לא זמינה כרגע</div>;
    }

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="w-full text-sm text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium h-10">
                    <tr>
                        <th className="px-3 text-center w-10">#</th>
                        <th className="px-3 text-right">קבוצה</th>
                        <th className="px-2 text-center w-8">מש</th>
                        <th className="px-2 text-center w-8 hidden sm:table-cell">נצ</th>
                        <th className="px-2 text-center w-8 hidden sm:table-cell">תי</th>
                        <th className="px-2 text-center w-8 hidden sm:table-cell">הפ</th>
                        <th className="px-2 text-center w-16 hidden sm:table-cell">שערים</th>
                        <th className="px-3 text-center w-10 font-bold">נק</th>
                    </tr>
                </thead>
                <tbody>
                    {table.map((row) => {
                        const isMyTeam = row.team.includes('Beitar Haifa') || row.team.includes('בית"ר חיפה');
                        return (
                            <tr
                                key={row.position}
                                className={`
                  border-b border-gray-50 last:border-none hover:bg-gray-50 h-12 transition-colors
                  ${isMyTeam ? 'bg-blue-50/50' : ''}
                `}
                            >
                                <td className={`px-3 text-center ${isMyTeam ? 'font-bold text-blue-800' : ''}`}>{row.position}</td>
                                <td className={`px-3 text-right font-medium ${isMyTeam ? 'text-blue-900 font-bold' : 'text-gray-900'}`}>
                                    {row.team}
                                </td>
                                <td className="px-2 text-center">{row.games}</td>
                                <td className="px-2 text-center text-gray-500 hidden sm:table-cell">{row.wins}</td>
                                <td className="px-2 text-center text-gray-500 hidden sm:table-cell">{row.draws}</td>
                                <td className="px-2 text-center text-gray-500 hidden sm:table-cell">{row.losses}</td>
                                <td className="px-2 text-center text-gray-400 hidden sm:table-cell ltr:text-right">{row.goals}</td>
                                <td className="px-3 text-center font-bold text-gray-900">{row.points}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
