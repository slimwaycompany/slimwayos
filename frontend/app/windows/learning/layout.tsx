import WindowShell from '@/app/components/WindowShell';

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <WindowShell title="Обучение">
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </WindowShell>
  );
}
