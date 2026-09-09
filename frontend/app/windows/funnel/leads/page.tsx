import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Лиды' };

const columns = ['Новый', 'В работе', 'Квалифицирован', 'Пробное', 'Сделка', 'Отказ'];

export default function LeadsPage() {
  return (
    <div className="flex h-full gap-3 overflow-x-auto">
      {columns.map((col) => (
        <div key={col} className="flex w-52 shrink-0 flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-body font-medium text-gray-300">{col}</span>
            <span className="text-caption text-gray-500">0</span>
          </div>
          <div className="glass flex flex-1 flex-col gap-2 rounded-xl p-3 min-h-[200px]">
            <p className="text-caption text-gray-600 text-center mt-8">Нет лидов</p>
          </div>
        </div>
      ))}
    </div>
  );
}
