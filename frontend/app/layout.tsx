import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeLoader from './components/ThemeLoader';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: 'SlimWay OS',
    template: '%s | SlimWay OS',
  },
  description: 'Платформа для управления похудением и здоровым образом жизни',
  keywords: ['похудение', 'диета', 'здоровье', 'фитнес', 'SlimWay'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeLoader />
        {children}
      </body>
    </html>
  );
}
