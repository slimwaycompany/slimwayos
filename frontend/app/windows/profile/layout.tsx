import WindowShell from '@/app/components/WindowShell';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Профиль">
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </WindowShell>
  );
}
