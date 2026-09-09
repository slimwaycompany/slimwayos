import WindowShell from '@/app/components/WindowShell';
import SettingsSidebar from './SettingsSidebar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Настройки">
      <div className="flex flex-1 overflow-hidden">
        <SettingsSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </WindowShell>
  );
}
