import React from 'react';

interface MatchRowProps {
    homeTeam: string;
    awayTeam: string;
    date: string;
    time: string;
    score?: string; // e.g. "2-1"
    isFinished?: boolean;
}

export default function MatchRow({
    homeTeam,
    awayTeam,
    date,
    time,
    score,
    isFinished = false,
    teamName, // New prop
}: MatchRowProps & { teamName?: string }) { // Extended interface inline or separately
    return (
        <div className="group bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer mb-2 relative"> {/* Added relative for badge positioning if needed, or flex layout */}

            {/* Team Badge - Optional */}
            {teamName && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 whitespace-nowrap">
                    {teamName}
                </div>
            )}

            <div className="flex items-center justify-between">
                {/* Home Team (Right) */}
                <div className="flex items-center gap-3 flex-1 justify-start min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0 border border-gray-200">
                        {homeTeam.charAt(0)}
                    </div>
                    <span className="text-gray-900 text-sm font-medium truncate">{homeTeam}</span>
                </div>

                {/* Center - Score/Time */}
                <div className="flex flex-col items-center justify-center w-24 shrink-0 mx-2 mt-1"> {/* Added mt-1 to account for badge if needed */}
                    {score && isFinished ? (
                        <span className="text-lg font-bold text-gray-900 tracking-tight font-mono">
                            {score}
                        </span>
                    ) : (
                        <div className="bg-gray-100/80 text-gray-500 px-2 py-0.5 rounded-md text-[11px] font-medium border border-gray-200/50">
                            {time}
                        </div>
                    )}
                    {/* Date Display */}
                    <span className="text-gray-400 text-[10px] mt-1 font-medium tracking-tight">
                        {date}
                    </span>
                </div>

                {/* Away Team (Left) */}
                <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                    <span className="text-gray-900 text-sm font-medium truncate">{awayTeam}</span>
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0 border border-gray-200">
                        {awayTeam.charAt(0)}
                    </div>
                </div>
            </div>
        </div>
    );
}
