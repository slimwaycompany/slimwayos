import WindowShell from '@/app/components/WindowShell';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Настройки">
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </WindowShell>
  );
}
