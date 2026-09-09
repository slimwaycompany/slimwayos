import WindowHeader from '@/app/components/WindowHeader';

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <WindowHeader title="Обучение" />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
