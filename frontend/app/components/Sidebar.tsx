'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scale,
  Utensils,
  Activity,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/weight', label: 'Вес', icon: Scale },
  { href: '/nutrition', label: 'Питание', icon: Utensils },
  { href: '/activity', label: 'Активность', icon: Activity },
  { href: '/profile', label: 'Профиль', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-white shadow-sm">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold text-green-600">SlimWay OS</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t px-3 py-4 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Settings className="h-5 w-5" />
          Настройки
        </Link>
        <button
          onClick={() => {}}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
