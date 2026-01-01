import { getUnifiedGames } from '@/lib/data';
import MatchRow from '@/components/MatchRow';
import Image from 'next/image';

export default async function Home() {
  const { upcomingGames, recentResults } = await getUnifiedGames();

  // Helper date formatter
  const formatDateTitle = (dateObj?: Date) => {
    if (!dateObj) return '';
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(dateObj);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center relative overflow-hidden">
        {/* Abstract background blobs (optional) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-900/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 mb-6 relative hover:scale-105 transition-transform duration-300">
            {/* Logo Image */}
            <Image
              src="/logo.png"
              alt="Beitar Haifa Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-1 md:mb-2 tracking-tight text-center">
            בית"ר יעקב חיפה
          </h1>
          <p className="text-gray-500 font-medium">
            הבית של הכדורגל החיפאי
          </p>
        </div>
      </div>

      {/* Upcoming Games */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-900">המשחקים הקרובים</h2>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {upcomingGames.length > 0 ? (
          <div className="space-y-3">
            {upcomingGames.map((game, index) => (
              <MatchRow
                key={`upcoming-${index}`}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                date={game.date}
                time={game.time}
                score={game.result_score} // Should be empty/undefined for upcoming generally
                isFinished={false}
                teamName={game._teamName}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">אין משחקים קרובים בלוח הזמנים</p>
          </div>
        )}
      </section>

      {/* Recent Results */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-gray-900">תוצאות אחרונות מכל הגילאים</h2>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {recentResults.length > 0 ? (
          <div className="space-y-3">
            {recentResults.slice(0, 20).map((game, index) => ( // Limit to 20 for performance/cleanliness
              <MatchRow
                key={`recent-${index}`}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                date={game.date}
                time={game.time}
                score={game.result_score}
                isFinished={true}
                teamName={game._teamName}
              />
            ))}
            {recentResults.length > 20 && (
              <div className="text-center pt-4">
                <span className="text-sm text-gray-400">מוצגות 20 התוצאות האחרונות</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">לא נמצאו תוצאות אחרונות</p>
          </div>
        )}
      </section>
    </div>
  );
}
