import WindowShell from '@/app/components/WindowShell';

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="HR">
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </WindowShell>
  );
}
