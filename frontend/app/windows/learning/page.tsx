'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

// TODO: здесь будет fetch материалов с backend/Supabase
const days = [
  {
    label: 'День 1',
    sections: ['Введение в SlimWay', 'Продукт и линейка услуг'],
  },
  {
    label: 'День 2',
    sections: ['Работа с клиентами', 'CRM и воронка продаж'],
  },
  {
    label: 'День 3',
    sections: ['Скрипты продаж', 'Работа с возражениями'],
  },
  {
    label: 'День 4',
    sections: ['Финансовая грамотность', 'Отчётность'],
  },
  {
    label: 'День 5',
    sections: ['Итоговая аттестация', 'Обратная связь'],
  },
];

export default function LearningPage() {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <div className="flex h-full gap-6">
      {/* Tab list */}
      <div className="flex w-40 shrink-0 flex-col gap-1">
        {days.map((day, i) => (
          <button
            key={day.label}
            onClick={() => setActiveDay(i)}
            className={clsx(
              'rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors',
              activeDay === i
                ? 'bg-green-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
            )}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">
          {days[activeDay].label}
        </h2>
        <div className="flex flex-col gap-3">
          {days[activeDay].sections.map((section, i) => (
            <div
              key={section}
              className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400">
                {i + 1}
              </span>
              <span className="text-sm text-gray-300">{section}</span>
              <span className="ml-auto text-xs text-gray-600">скоро</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
