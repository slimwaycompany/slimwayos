import WindowShell from '@/app/components/WindowShell';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Профиль">
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </WindowShell>
  );
}
