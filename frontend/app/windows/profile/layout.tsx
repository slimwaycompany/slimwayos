import WindowShell from '@/app/components/WindowShell';
import ProfileSidebar from './ProfileSidebar';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Профиль">
      <div className="flex flex-1 overflow-hidden">
        <ProfileSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </WindowShell>
  );
}
