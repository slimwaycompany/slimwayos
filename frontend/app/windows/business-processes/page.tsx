'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface Process {
  id: string;
  title: string;
  description: string;
  content: string;
  disabled?: boolean;
}

const processes: Process[] = [
  {
    id: 'srz',
    title: 'СРЗ',
    description: 'Стандарты работы заведения',
    content: 'Общие стандарты работы заведения — документы и регламенты появятся здесь.',
  },
  {
    id: 'shift-mark',
    title: 'Отметка на смене',
    description: 'Фиксация начала смены',
    content: 'Процесс отметки начала смены сотрудником. Функционал в разработке.',
  },
  {
    id: 'shift-close',
    title: 'Чек сдача смены',
    description: 'Закрытие и сдача смены',
    content: 'Чеклист и процедура закрытия смены. Функционал в разработке.',
  },
  {
    id: 'shift-accept',
    title: 'Прием смены',
    description: 'Приёмка смены от предыдущего сотрудника',
    content: 'Форма и процедура приёма смены. Функционал в разработке.',
  },
  {
    id: 'supplies',
    title: 'Заявка на расходники',
    description: 'Запрос расходных материалов',
    content: 'Форма заявки на расходники и просмотр статуса. Функционал в разработке.',
  },
  {
    id: 'onboarding',
    title: 'Онбординг',
    description: 'Введение нового сотрудника',
    content: '',
    disabled: true,
  },
  {
    id: 'quality',
    title: 'Контроль качества',
    description: 'Проверки и стандарты',
    content: '',
    disabled: true,
  },
  {
    id: 'inventory',
    title: 'Инвентаризация',
    description: 'Учёт товаров и расходников',
    content: '',
    disabled: true,
  },
];

export default function BusinessProcessesPage() {
  const [active, setActive] = useState<Process | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {processes.map((p) => (
          <button
            key={p.id}
            disabled={p.disabled}
            onClick={() => !p.disabled && setActive(p)}
            className={clsx(
              'flex flex-col gap-2 rounded-2xl p-6 text-left transition-all duration-200',
              p.disabled
                ? 'cursor-not-allowed glass opacity-40'
                : 'glass-hover cursor-pointer',
            )}
          >
            <span className="text-body font-semibold text-gray-100">{p.title}</span>
            <span className="text-caption text-gray-500">{p.description}</span>
            {p.disabled && (
              <span className="mt-1 w-fit rounded-full bg-white/5 px-2 py-0.5 text-caption text-gray-500">
                скоро
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="glass flex h-[500px] w-[640px] flex-col p-6 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex shrink-0 items-center justify-between">
              <h2 className="text-subheading text-white">{active.title}</h2>
              <button
                onClick={() => setActive(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <p className="text-body text-gray-400">{active.description}</p>
              <p className="mt-4 text-body text-gray-500">{active.content}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
