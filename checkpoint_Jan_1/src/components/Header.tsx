'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`bg-white h-16 flex items-center justify-center px-6 sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-md border-b-0' : 'border-b border-gray-200 shadow-none'
                }`}
        >
            <Link href="/" className="flex items-center justify-center h-full py-2 hover:opacity-90 transition-opacity">
                {/* Logo Image */}
                <img
                    src="/logo.png"
                    alt="Beitar Haifa Logo"
                    className="h-full w-auto object-contain"
                />
            </Link>
        </header>
    );
}
