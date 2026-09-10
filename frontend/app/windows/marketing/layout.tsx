import type { Metadata } from 'next';
import WindowShell from '@/app/components/WindowShell';

export const metadata: Metadata = { title: 'Маркетинг' };

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Маркетинг">
      <main className="flex-1 overflow-auto">{children}</main>
    </WindowShell>
  );
}
