'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const BASE = '/windows/branch-settings';

const navItems = [
  { href: `${BASE}/employees`,          label: 'Сотрудники' },
  { href: `${BASE}/promo-codes`,        label: 'Промокоды' },
  { href: `${BASE}/membership-types`,   label: 'Абонементы' },
  { href: `${BASE}/products`,           label: 'Товары' },
  { href: `${BASE}/payment-methods`,    label: 'Способы оплаты' },
  { href: `${BASE}/legal-entities`,     label: 'Юр. лицо' },
  { href: `${BASE}/devices`,            label: 'Аппараты' },
  { href: `${BASE}/device-slots`,       label: 'Слоты' },
  { href: `${BASE}/lead-sources`,       label: 'Рекламные источники' },
  { href: `${BASE}/document-templates`, label: 'Документооборот' },
  { href: `${BASE}/decline-reasons`,    label: 'Причины отказов' },
  { href: `${BASE}/general`,            label: 'Общие параметры' },
  { href: `${BASE}/integrations`,       label: 'Интеграции' },
];

export default function BranchSettingsSidebar() {
  const pathname = usePathname();
  return (
    <aside className="glass-panel w-52 shrink-0 border-r overflow-y-auto">
      <nav className="flex flex-col gap-0.5 p-3">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'block rounded-lg px-4 py-2 text-sm font-medium transition-colors',
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
