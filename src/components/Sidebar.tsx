import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import SidebarClient from './SidebarClient';

async function getTeams() {
    const filePath = path.join(process.cwd(), 'db.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.teams || [];
}

export default async function Sidebar() {
    const teams = await getTeams();

    return <SidebarClient teams={teams} />;
}
