import WindowShell from '@/app/components/WindowShell';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Аналитика">
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </WindowShell>
  );
}
