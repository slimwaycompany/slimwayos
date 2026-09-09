import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Звуки и уведомления' };

export default function SoundsPage() {
  return (
    <div className="p-6">
      <h2 className="text-subheading text-white">Звуки и уведомления</h2>
      <p className="mt-2 text-body text-gray-400">— в разработке</p>
    </div>
  );
}
