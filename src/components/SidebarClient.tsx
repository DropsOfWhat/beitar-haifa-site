'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface Team {
    name: string;
    url: string;
    games: any[];
}

interface SidebarClientProps {
    teams: Team[];
}

export default function SidebarClient({ teams }: SidebarClientProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Toggle Button - Floating */}
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2.5 bg-white text-gray-700 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Menu"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                )}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                w-72 md:w-64 bg-white border-l border-gray-200 h-screen overflow-y-auto
                fixed top-0 right-0 z-50 shadow-2xl md:shadow-none md:static md:block
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between md:hidden mb-6 pl-2">
                        <h2 className="text-xl font-bold text-gray-900">תפריט</h2>
                        {/* Close button inside sidebar as well */}
                    </div>

                    <h2 className="text-lg font-bold text-gray-800 mb-4 px-2 hidden md:block">קבוצות</h2>

                    <nav className="space-y-1.5">
                        <Link
                            href="/"
                            onClick={() => setIsOpen(false)}
                            className={`block px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 
                                ${pathname === '/'
                                    ? 'bg-yellow-50 text-yellow-700 font-bold border border-yellow-100 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                                }`}
                        >
                            דף הבית
                        </Link>

                        <div className="my-3 border-t border-gray-100 dark:border-gray-800"></div>

                        {teams.map((team, index) => {
                            const isActive = pathname === `/team/${index}`;
                            return (
                                <Link
                                    key={index}
                                    href={`/team/${index}`}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 
                                        ${isActive
                                            ? 'bg-yellow-50 text-yellow-700 font-bold border border-yellow-100 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                                        }`}
                                >
                                    {team.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
}
