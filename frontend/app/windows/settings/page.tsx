import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Настройки' };

export default function SettingsPage() {
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      Окно Настройки — в разработке
    </div>
  );
}
