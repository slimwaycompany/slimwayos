import WindowShell from '@/app/components/WindowShell';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Разработчик">
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </WindowShell>
  );
}
