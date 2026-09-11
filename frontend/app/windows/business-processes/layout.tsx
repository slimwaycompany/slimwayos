import WindowShell from '@/app/components/WindowShell';

export default function BusinessProcessesLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Бизнес-процессы">
      <main className="flex-1 overflow-hidden">{children}</main>
    </WindowShell>
  );
}
