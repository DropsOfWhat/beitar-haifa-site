import Link from 'next/link';
import fs from 'fs';
import path from 'path';

async function getTeams() {
    const filePath = path.join(process.cwd(), 'db.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.teams || [];
}

export default async function Sidebar() {
    const teams = await getTeams();

    return (
        <aside className="w-64 bg-white border-l border-gray-200 flex-shrink-0 h-screen sticky top-0 overflow-y-auto hidden md:block shadow-sm z-20">
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">קבוצות</h2>
                <nav className="space-y-1">
                    {teams.map((team: any, index: number) => (
                        <Link
                            key={index}
                            href={`/team/${index}`}
                            className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            {team.name}
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
