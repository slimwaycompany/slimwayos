'use client';

import { clsx } from 'clsx';

export interface NavSection {
  id: string;
  label: string;
}

interface WindowNavProps {
  sections: NavSection[];
  active: string;
  onSelect: (id: string) => void;
}

export default function WindowNav({ sections, active, onSelect }: WindowNavProps) {
  return (
    <aside className="glass-panel w-52 shrink-0 border-r">
      <nav className="flex flex-col gap-0.5 p-3">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={clsx(
              'w-full rounded-lg px-4 py-2.5 text-left text-body font-medium transition-colors',
              active === id
                ? 'bg-[#02BDB6]/15 text-[#02BDB6]'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-100',
            )}
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
