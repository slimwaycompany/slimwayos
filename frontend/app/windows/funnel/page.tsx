import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Воронка' };

export default function FunnelPage() {
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      Выберите раздел в боковом меню
    </div>
  );
}
