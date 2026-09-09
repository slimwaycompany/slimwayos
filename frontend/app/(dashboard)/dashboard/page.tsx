import type { Metadata } from 'next';
import StatsCard from '@/app/components/StatsCard';

export const metadata: Metadata = { title: 'Дашборд' };

const stats = [
  { label: 'Текущий вес', value: '—', unit: 'кг', color: 'green' },
  { label: 'Цель', value: '—', unit: 'кг', color: 'blue' },
  { label: 'Прогресс', value: '—', unit: '%', color: 'purple' },
  { label: 'Дней в программе', value: '—', unit: 'дн', color: 'orange' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Добро пожаловать в SlimWay OS</h1>
        <p className="mt-1 text-sm text-gray-500">Отслеживайте свой прогресс и достигайте целей</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatsCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">График веса</h2>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
            Данные появятся после первой записи
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Питание сегодня</h2>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
            Добавьте первый приём пищи
          </div>
        </div>
      </div>
    </div>
  );
}
