import type { Metadata } from 'next';
import WindowShell from '@/app/components/WindowShell';

export const metadata: Metadata = { title: 'Аналитика' };

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Аналитика">
      <main className="flex-1 overflow-auto">{children}</main>
    </WindowShell>
  );
}
