import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Продажи' };

const sections = ['Чекаут / корзина', 'Прайс-лист', 'Промокоды', 'Склад / остатки'];

export default function FunnelSalesPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {sections.map((s) => (
        <div key={s} className="glass rounded-xl p-5">
          <p className="text-body font-semibold text-gray-200">{s}</p>
          <p className="mt-1 text-caption text-gray-500">— в разработке</p>
        </div>
      ))}
    </div>
  );
}
