import WindowHeader from '@/app/components/WindowHeader';
import FunnelSidebar from './FunnelSidebar';

export default function FunnelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <WindowHeader title="Воронка" />
      <div className="flex flex-1 overflow-hidden">
        <FunnelSidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
