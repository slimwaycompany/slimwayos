'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const navItems = [
  { href: '/windows/settings/appearance', label: 'Внешний вид' },
  { href: '/windows/settings/sounds',     label: 'Звуки и уведомления' },
  { href: '/windows/settings/location',   label: 'Локация' },
  { href: '/windows/settings/security',   label: 'Безопасность' },
];

export default function SettingsSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-52 shrink-0 border-r border-gray-800 bg-gray-900">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-teal/15 text-teal'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
