import WindowShell from '@/app/components/WindowShell';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Главная">
      <div className="flex-1 overflow-auto">{children}</div>
    </WindowShell>
  );
}
