import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Интеграции' };

export default function IntegrationsPage() {
  return (
    <div className="p-6">
      <h2 className="text-subheading text-white">Интеграции</h2>
      <p className="mt-2 text-body text-gray-400">— в разработке</p>
    </div>
  );
}
