import WindowShell from '@/app/components/WindowShell';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Разработчик">
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </WindowShell>
  );
}
