'use client';

import Link from 'next/link';
import {
  Filter,
  BarChart2,
  BookOpen,
  Layers,
  Users,
  User,
  Settings,
  Terminal,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Tile {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const tiles: Tile[] = [
  { key: 'funnel', label: 'Воронка', icon: Filter, href: '/windows/funnel' },
  { key: 'analytics', label: 'Аналитика', icon: BarChart2, href: '/windows/analytics' },
  { key: 'learning', label: 'Обучение', icon: BookOpen, href: '/windows/learning' },
  { key: 'business-processes', label: 'Бизнес-процессы', icon: Layers, href: '/windows/business-processes' },
  { key: 'hr', label: 'HR', icon: Users, href: '/windows/hr' },
  { key: 'profile', label: 'Профиль', icon: User, href: '/windows/profile' },
  { key: 'branch-settings', label: 'Настройки филиала', icon: Settings, href: '/windows/branch-settings' },
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
          {tiles.map(({ key, label, icon: Icon, href }) => (
            <Link key={key} href={href} className="block">
              <div
                className={clsx(
                  'group flex flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center transition-all duration-200',
                  'cursor-pointer border-gray-700 bg-gray-800/50',
                  'hover:border-green-500 hover:bg-gray-800 hover:shadow-lg hover:shadow-green-900/20',
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-900/50 text-green-400 transition-colors group-hover:bg-green-600 group-hover:text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-base font-semibold text-gray-100">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
