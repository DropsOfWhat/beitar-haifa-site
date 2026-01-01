import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import TeamTabs from '@/components/TeamTabs';

async function getTeamData(id: string) {
    const filePath = path.join(process.cwd(), 'db.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    const index = parseInt(id, 10);

    if (isNaN(index) || index < 0 || index >= data.teams.length) {
        return null;
    }

    return data.teams[index];
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const team = await getTeamData(id);

    if (!team) {
        return <div className="p-4">הקבוצה לא נמצאה</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors border border-gray-100"
                    aria-label="Back to Home"
                >
                    <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                    {/* If we had a league name, it would go here */}
                </div>
            </div>

            {/* Tabs Section */}
            <TeamTabs matches={team.games} table={team.table} teamName={team.name} />

            <div className="mt-4 text-center">
                <a
                    href={team.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                >
                    מקור הנתונים: ההתאחדות לכדורגל
                </a>
            </div>
        </div>
    );
}
