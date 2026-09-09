import WindowHeader from '@/app/components/WindowHeader';

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <WindowHeader title="HR" />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
