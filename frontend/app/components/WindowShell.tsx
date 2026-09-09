'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageSquare, HelpCircle, Bell, LayoutList, Cloud } from 'lucide-react';

const rightItems = [
  { icon: MessageSquare, label: 'Чат' },
  { icon: HelpCircle,    label: 'Подсказки' },
  { icon: Bell,          label: 'Уведомления' },
  { icon: LayoutList,    label: 'Сводка' },
];

interface WindowShellProps {
  title: string;
  children: React.ReactNode;
}

export default function WindowShell({ title, children }: WindowShellProps) {
  const router = useRouter();
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Glassmorphism header */}
      <header className="glass-panel flex shrink-0 items-center border-b px-6 py-3">
        <div className="flex-1" />

        <h1 className="text-sm font-semibold text-white">{title}</h1>

        <div className="flex flex-1 items-center justify-end gap-3">
          <span className="min-w-[2.8rem] text-center text-body tabular-nums text-gray-300">
            {time}
          </span>

          <div className="flex items-center gap-1 text-body text-gray-300">
            <Cloud className="h-3.5 w-3.5 text-gray-400" />
            <span>22°C</span>
          </div>

          <div title="Сервер онлайн" className="flex items-center gap-1.5">
            <span className="status-online h-2 w-2 rounded-full" />
            <span className="text-caption text-gray-400">online</span>
          </div>

          <button
            onClick={() => router.push('/hub')}
            aria-label="Закрыть окно"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">{children}</div>

        {/* Glassmorphism right sidebar */}
        <aside className="glass-panel flex w-16 shrink-0 flex-col items-center gap-2 border-l py-4">
          {rightItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              onClick={() => console.log(label)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-200"
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
