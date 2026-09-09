import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Общие параметры' };

export default function GeneralPage() {
  return (
    <div className="p-6">
      <h2 className="text-subheading text-white">Общие параметры</h2>
      <p className="mt-2 text-body text-gray-400">— в разработке</p>
    </div>
  );
}
