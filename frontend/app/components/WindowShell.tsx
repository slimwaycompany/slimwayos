'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageSquare, HelpCircle, Bell, LayoutList, Cloud } from 'lucide-react';

const rightItems = [
  { icon: MessageSquare, label: 'Чат' },
  { icon: HelpCircle, label: 'Подсказки' },
  { icon: Bell, label: 'Уведомления' },
  { icon: LayoutList, label: 'Сводка' },
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
      {/* Header */}
      <header className="flex items-center bg-gray-900 px-6 py-3">
        {/* Left spacer for centering */}
        <div className="flex-1" />

        {/* Center: window title */}
        <h1 className="text-base font-semibold text-white">{title}</h1>

        {/* Right: indicators + close */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Clock */}
          <span className="min-w-[2.8rem] text-center text-sm tabular-nums text-gray-300">
            {time}
          </span>

          {/* Weather placeholder */}
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <Cloud className="h-4 w-4 text-gray-400" />
            <span>22°C</span>
          </div>

          {/* Server status */}
          <div title="Сервер онлайн" className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-xs text-gray-500">online</span>
          </div>

          {/* Close */}
          <button
            onClick={() => router.push('/hub')}
            aria-label="Закрыть окно"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>
      <hr className="border-gray-800" />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">{children}</div>

        {/* Right sidebar */}
        <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-l border-gray-800 bg-gray-900 py-4">
          {rightItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              onClick={() => console.log(label)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-200"
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
