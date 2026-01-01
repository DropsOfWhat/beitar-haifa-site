import Link from "next/link";

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-10">
            <div className="flex items-center gap-3">
                {/* Placeholder for Logo - You can replace src with actual logo path later */}
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black border-2 border-black">
                    B
                </div>
                <Link href="/" className="text-xl font-bold text-gray-900">
                    בית"ר חיפה
                </Link>
            </div>
        </header>
    );
}
