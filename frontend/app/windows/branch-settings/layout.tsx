import WindowShell from '@/app/components/WindowShell';
import BranchSettingsSidebar from './BranchSettingsSidebar';

export default function BranchSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Настройки филиала">
      <div className="flex flex-1 overflow-hidden">
        <BranchSettingsSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </WindowShell>
  );
}
