import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Beitar Haifa',
  description: 'Beitar Haifa Football Club',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-50 min-h-screen text-gray-900 flex flex-row">
        {/* Sidebar on the Right (because of RTL, 'flex-row' puts first child start. In RTL start is right.) */}
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 w-full max-w-5xl mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
