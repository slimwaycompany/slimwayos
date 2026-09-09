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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-6 py-12">
      {/* Centered title */}
      <div className="mb-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          <span style={{ color: '#02BDB6' }}>SlimWay</span>
          <span style={{ color: '#263CD9' }}> OS</span>
        </h1>
        <p className="mt-2 text-sm text-gray-400">Выберите раздел</p>
      </div>

      {/* Tile grid */}
      <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map(({ key, label, icon: Icon, href }) => (
          <Link key={key} href={href} className="block">
            <div
              className={clsx(
                'group flex flex-col items-center justify-center gap-5 rounded-2xl border p-10 text-center transition-all duration-200',
                'border-gray-700 bg-gray-800/50',
                'hover:border-[#02BDB6]/60 hover:bg-gray-800 hover:shadow-xl hover:shadow-[#02BDB6]/10',
              )}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl transition-colors"
                style={{ background: 'rgba(2,189,182,0.12)', color: '#02BDB6' }}
              >
                <Icon
                  className="h-8 w-8 transition-colors group-hover:text-white"
                  style={{ color: 'inherit' }}
                />
              </div>
              <span className="text-lg font-semibold leading-tight text-gray-100">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
