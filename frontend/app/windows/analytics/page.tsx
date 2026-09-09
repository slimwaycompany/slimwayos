import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Аналитика' };

const columns = [
  {
    title: 'Финансы',
    cards: ['Выручка за период', 'Средний чек', 'Расходы'],
  },
  {
    title: 'Маркетинг',
    cards: ['Источники лидов', 'Конверсия воронки', 'Стоимость привлечения'],
  },
  {
    title: 'Клиенты',
    cards: ['Новые клиенты', 'Повторные визиты', 'Отток клиентов'],
  },
];

export default function AnalyticsPage() {
  return (
    <div className="flex h-full gap-4 overflow-x-auto p-1">
      {columns.map((col) => (
        <div key={col.title} className="flex w-72 shrink-0 flex-col gap-3">
          <h2 className="font-semibold text-gray-200">{col.title}</h2>
          {col.cards.map((card) => (
            <div
              key={card}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-500"
            >
              <p className="mb-2 font-medium text-gray-300">{card}</p>
              <p className="text-xs">Отчёт появится здесь</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
