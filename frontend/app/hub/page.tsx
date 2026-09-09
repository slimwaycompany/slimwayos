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
  GitBranch,
  Terminal,
} from 'lucide-react';

interface Tile {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const tiles: Tile[] = [
  { key: 'funnel',             label: 'Воронка',            icon: Filter,    href: '/windows/funnel' },
  { key: 'analytics',          label: 'Аналитика',          icon: BarChart2, href: '/windows/analytics' },
  { key: 'learning',           label: 'Обучение',           icon: BookOpen,  href: '/windows/learning' },
  { key: 'business-processes', label: 'Бизнес-процессы',    icon: Layers,    href: '/windows/business-processes' },
  { key: 'hr',                 label: 'HR',                 icon: Users,     href: '/windows/hr' },
  { key: 'profile',            label: 'Профиль',            icon: User,      href: '/windows/profile' },
  { key: 'settings',           label: 'Настройки',          icon: Settings,  href: '/windows/settings' },
  { key: 'branch-settings',    label: 'Настройки филиала',  icon: GitBranch, href: '/windows/branch-settings' },
  { key: 'developer',          label: 'Разработчик',        icon: Terminal,  href: '/windows/developer' },
];

export default function HubPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-[#0a0f1e] to-gray-950 px-6 py-12">
      {/* Hero title */}
      <div className="mb-2 text-center">
        <h1 className="text-display font-extrabold tracking-tight">
          <span style={{ color: '#02BDB6' }}>SlimWay</span>
          <span style={{ color: '#263CD9' }}> OS</span>
        </h1>
        <p className="mt-3 text-body text-gray-400">Выберите раздел</p>
      </div>

      {/* 9-tile grid */}
      <div className="mt-10 grid w-full max-w-5xl grid-cols-3 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(({ key, label, icon: Icon, href }) => (
          <Link key={key} href={href} className="block">
            <div className="glass-hover group flex flex-col items-center justify-center gap-5 p-10 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-110"
                style={{ background: 'rgba(2,189,182,0.12)', color: '#02BDB6' }}
              >
                <Icon className="h-8 w-8" />
              </div>
              <span className="text-body font-semibold leading-tight text-gray-100">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
