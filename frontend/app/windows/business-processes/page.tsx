'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface Process {
  id: string;
  title: string;
  description: string;
  items?: string[];
  disabled?: boolean;
}

const processes: Process[] = [
  {
    id: 'srz',
    title: 'СРЗ',
    description: 'Стандарты работы заведения',
    items: [
      'Отметка на смене',
      'Чек сдача смены',
      'Прием смены',
      'Заявка на расходники',
    ],
  },
  {
    id: 'onboarding',
    title: 'Онбординг',
    description: 'Введение нового сотрудника',
    disabled: true,
  },
  {
    id: 'quality',
    title: 'Контроль качества',
    description: 'Проверки и стандарты обслуживания',
    disabled: true,
  },
  {
    id: 'inventory',
    title: 'Инвентаризация',
    description: 'Учёт товаров и расходников',
    disabled: true,
  },
];

export default function BusinessProcessesPage() {
  const [activeProcess, setActiveProcess] = useState<Process | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {processes.map((p) => (
          <button
            key={p.id}
            disabled={p.disabled}
            onClick={() => !p.disabled && setActiveProcess(p)}
            className={clsx(
              'flex flex-col gap-2 rounded-2xl border p-6 text-left transition-all duration-200',
              p.disabled
                ? 'cursor-not-allowed border-gray-800 bg-gray-900/30 opacity-50'
                : 'border-gray-700 bg-gray-900 hover:border-green-500 hover:shadow-lg hover:shadow-green-900/20',
            )}
          >
            <span className="font-semibold text-gray-100">{p.title}</span>
            <span className="text-xs text-gray-500">{p.description}</span>
            {p.disabled && (
              <span className="mt-1 w-fit rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
                скоро
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Modal */}
      {activeProcess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveProcess(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{activeProcess.title}</h2>
              <button
                onClick={() => setActiveProcess(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-400">{activeProcess.description}</p>
            {activeProcess.items && (
              <ul className="flex flex-col gap-2">
                {activeProcess.items.map((item) => (
                  <li key={item}>
                    <button className="w-full rounded-lg border border-gray-800 bg-gray-800/50 px-4 py-3 text-left text-sm text-gray-200 transition-colors hover:border-green-600 hover:bg-gray-800">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
