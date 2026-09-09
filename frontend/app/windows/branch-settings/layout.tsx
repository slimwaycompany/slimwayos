import WindowShell from '@/app/components/WindowShell';

export default function BranchSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Настройки филиала">
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </WindowShell>
  );
}
