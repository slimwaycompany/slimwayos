import WindowShell from '@/app/components/WindowShell';

export default function BranchSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Настройки филиала">
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </WindowShell>
  );
}
