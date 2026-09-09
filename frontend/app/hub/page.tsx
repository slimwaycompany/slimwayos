'use client';

import Link from 'next/link';
import {
  DollarSign,
  BarChart2,
  BookOpen,
  Clock,
  User,
  Settings,
  Terminal,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Tile {
  key: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

const tiles: Tile[] = [
  { key: 'sales', label: 'Продажи', icon: DollarSign, href: '/windows/sales' },
  { key: 'analytics', label: 'Аналитика', icon: BarChart2, href: '/windows/analytics' },
  { key: 'learning', label: 'Обучение', icon: BookOpen, href: '/windows/learning' },
  { key: 'placeholder', label: 'Скоро', icon: Clock, disabled: true, badge: 'В разработке' },
  { key: 'profile', label: 'Профиль', icon: User, href: '/windows/profile' },
  { key: 'settings', label: 'Настройки', icon: Settings, href: '/windows/settings' },
  { key: 'developer', label: 'Разработчик', icon: Terminal, href: '/windows/developer' },
];

export default function HubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-green-950">
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SlimWay OS</h1>
          <p className="text-sm text-gray-400">Выберите раздел</p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map(({ key, label, icon: Icon, href, disabled, badge }) => {
            const card = (
              <div
                className={clsx(
                  'group relative flex flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center transition-all duration-200',
                  disabled
                    ? 'cursor-not-allowed border-gray-700 bg-gray-800/30 opacity-50'
                    : 'cursor-pointer border-gray-700 bg-gray-800/50 hover:border-green-500 hover:bg-gray-800 hover:shadow-lg hover:shadow-green-900/20',
                )}
              >
                {badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                    {badge}
                  </span>
                )}
                <div
                  className={clsx(
                    'flex h-14 w-14 items-center justify-center rounded-xl',
                    disabled
                      ? 'bg-gray-700 text-gray-500'
                      : 'bg-green-900/50 text-green-400 transition-colors group-hover:bg-green-600 group-hover:text-white',
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <span
                  className={clsx(
                    'text-base font-semibold',
                    disabled ? 'text-gray-500' : 'text-gray-100',
                  )}
                >
                  {label}
                </span>
              </div>
            );

            if (disabled || !href) return <div key={key}>{card}</div>;
            return (
              <Link key={key} href={href} className="block">
                {card}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
