'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const BASE = '/windows/profile';

const navItems = [
  { href: `${BASE}/personal-data`, label: 'Личные данные' },
  { href: `${BASE}/shifts`,        label: 'Мои смены / график' },
  { href: `${BASE}/tasks`,         label: 'Мои задачи' },
  { href: `${BASE}/notifications`, label: 'Уведомления' },
  { href: `${BASE}/history`,       label: 'История действий' },
];

export default function ProfileSidebar() {
  const pathname = usePathname();
  return (
    <aside className="glass-panel w-52 shrink-0 border-r">
      <nav className="flex flex-col gap-0.5 p-3">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-[#02BDB6]/15 text-[#02BDB6]'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-100',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
