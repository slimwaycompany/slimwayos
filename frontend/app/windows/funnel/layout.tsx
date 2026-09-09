import WindowShell from '@/app/components/WindowShell';
import FunnelSidebar from './FunnelSidebar';

export default function FunnelLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Воронка">
      <div className="flex h-full flex-1 overflow-hidden">
        <FunnelSidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </WindowShell>
  );
}
