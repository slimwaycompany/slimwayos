import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Расписание' };

const sections = ['Календарь', 'Лист ожидания'];

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((s) => (
        <div key={s} className="glass rounded-xl p-5">
          <p className="text-body font-semibold text-gray-200">{s}</p>
          <p className="mt-1 text-caption text-gray-500">— в разработке</p>
        </div>
      ))}
    </div>
  );
}
