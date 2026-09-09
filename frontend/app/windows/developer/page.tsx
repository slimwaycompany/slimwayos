'use client';

import { useState } from 'react';
import WindowNav, { type NavSection } from '@/app/components/WindowNav';

const sections: NavSection[] = [
  { id: 'roles',        label: 'Роли и права' },
  { id: 'users',        label: 'Пользователи' },
  { id: 'features',     label: 'Реестр функций' },
  { id: 'windows',      label: 'Управление окнами' },
  { id: 'api-keys',     label: 'API-ключи' },
  { id: 'webhooks',     label: 'Webhooks' },
  { id: 'audit',        label: 'Аудит-лог' },
  { id: 'flags',        label: 'Feature flags' },
  { id: 'backups',      label: 'Резервные копии' },
];

export default function DeveloperPage() {
  const [active, setActive] = useState(sections[0].id);
  const current = sections.find((s) => s.id === active)!;

  return (
    <div className="flex h-full flex-1">
      <WindowNav sections={sections} active={active} onSelect={setActive} />
      <main className="flex-1 overflow-auto p-6">
        <h2 className="text-subheading text-white">{current.label}</h2>
        <p className="mt-2 text-body text-gray-400">{current.label} — в разработке</p>
      </main>
    </div>
  );
}
