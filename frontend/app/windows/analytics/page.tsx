import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Аналитика' };

const columns = [
  {
    title: 'Финансы',
    cards: [
      'Дашборд KPI',
      'Отчёт по продажам',
      'Сравнение периодов',
      'Экспорт отчётов',
    ],
  },
  {
    title: 'Маркетинг',
    cards: [
      'Воронка конверсии %',
      'Отчёт по источникам лидов',
    ],
  },
  {
    title: 'Клиенты',
    cards: [
      'Retention / LTV',
      'Прогноз оттока',
    ],
  },
  {
    title: 'Операции',
    cards: [
      'Загрузка аппаратов / расписания',
      'KPI сотрудников',
    ],
  },
];

export default function AnalyticsPage() {
  return (
    <div className="flex h-full gap-4 overflow-x-auto p-1">
      {columns.map((col) => (
        <div key={col.title} className="flex w-64 shrink-0 flex-col gap-3">
          <h2 className="text-body font-semibold text-gray-200">{col.title}</h2>
          {col.cards.map((card) => (
            <div key={card} className="glass rounded-xl p-4">
              <p className="text-body font-medium text-gray-300">{card}</p>
              <p className="mt-1 text-caption text-gray-500">Отчёт появится здесь</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
