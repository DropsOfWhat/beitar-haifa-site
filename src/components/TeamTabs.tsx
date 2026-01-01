"use client";

import { useState } from 'react';
import MatchRow from './MatchRow';
import LeagueTable from './LeagueTable';

interface TeamTabsProps {
    matches: any[];
    table: any[];
    teamName: string;
}

export default function TeamTabs({ matches, table }: TeamTabsProps) {
    const [activeTab, setActiveTab] = useState<'matches' | 'table'>('matches');

    return (
        <div>
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('matches')}
                    className={`
            pb-3 px-1 text-sm font-medium transition-colors relative ml-6
            ${activeTab === 'matches' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
          `}
                >
                    לוח משחקים
                    {activeTab === 'matches' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('table')}
                    className={`
            pb-3 px-1 text-sm font-medium transition-colors relative
            ${activeTab === 'table' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
          `}
                >
                    טבלה
                    {activeTab === 'table' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                    )}
                </button>
            </div>

            <div className="min-h-[300px]">
                {activeTab === 'matches' ? (
                    matches && matches.length > 0 ? (
                        <div className="space-y-1">
                            {matches.map((game, index) => {
                                const hasScore = game.result_score && game.result_score.trim() !== "";
                                return (
                                    <MatchRow
                                        key={index}
                                        homeTeam={game.homeTeam}
                                        awayTeam={game.awayTeam}
                                        date={game.date}
                                        time={game.time}
                                        score={hasScore ? game.result_score : undefined}
                                        isFinished={hasScore}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8 bg-white rounded-xl border border-gray-100">
                            אין משחקים להצגה
                        </div>
                    )
                ) : (
                    <LeagueTable table={table} />
                )}
            </div>
        </div>
    );
}
