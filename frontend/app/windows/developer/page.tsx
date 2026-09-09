import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Разработчик' };

export default function DeveloperPage() {
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      Окно Разработчик — в разработке
    </div>
  );
}
