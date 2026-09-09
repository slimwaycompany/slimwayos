'use client';

import { useEffect, useState } from 'react';
import { API, authHeaders } from '@/lib/auth';

const BG_COLORS = [
  { value: '#000000', label: 'Чёрный' },
  { value: '#FFFFFF', label: 'Белый' },
  { value: '#0F172A', label: 'Тёмно-синий' },
  { value: '#1C1917', label: 'Тёмно-коричневый' },
  { value: '#111827', label: 'Графит' },
  { value: '#F5F5F4', label: 'Тёплый белый' },
  { value: '#0A0A0A', label: 'Почти чёрный' },
  { value: '#18181B', label: 'Антрацит' },
];

const TEXT_COLORS = [
  { value: '#FFFFFF', label: 'Белый' },
  { value: '#000000', label: 'Чёрный' },
  { value: '#E5E7EB', label: 'Светло-серый' },
  { value: '#374151', label: 'Тёмно-серый' },
  { value: '#02BDB6', label: 'Teal' },
  { value: '#263CD9', label: 'Blue' },
  { value: '#F59E0B', label: 'Янтарный' },
  { value: '#10B981', label: 'Зелёный' },
  { value: '#EF4444', label: 'Красный' },
  { value: '#94A3B8', label: 'Серо-голубой' },
];

const LIGHT = new Set(['#FFFFFF', '#F5F5F4', '#E5E7EB']);

function applyAndSave(bg: string, text: string) {
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--text', text);
  localStorage.setItem('theme_bg', bg);
  localStorage.setItem('theme_text', text);
}

function saveToProfile(patch: Record<string, string>) {
  fetch(`${API}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  }).catch(() => {});
}

export default function AppearancePage() {
  const [bg, setBg]     = useState('#030711');
  const [text, setText] = useState('#F1F5F9');

  useEffect(() => {
    setBg(localStorage.getItem('theme_bg')   ?? '#030711');
    setText(localStorage.getItem('theme_text') ?? '#F1F5F9');
  }, []);

  const pickBg = (color: string) => {
    setBg(color);
    applyAndSave(color, text);
    saveToProfile({ theme_bg_color: color });
  };

  const pickText = (color: string) => {
    setText(color);
    applyAndSave(bg, color);
    saveToProfile({ theme_font_color: color });
  };

  const swatchCls = (selected: boolean) =>
    `h-10 w-10 rounded-xl transition-all duration-150 cursor-pointer ${
      selected
        ? 'ring-2 ring-[#02BDB6] ring-offset-2 ring-offset-[#030711] scale-110'
        : 'hover:scale-105 opacity-90 hover:opacity-100'
    }`;

  const lightBorder = 'border border-white/20';
  const darkBorder  = 'border border-white/6';

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-subheading text-white mb-6">Внешний вид</h2>

      <section className="mb-8">
        <h3 className="text-body font-semibold text-gray-300 mb-3">Цвет фона</h3>
        <div className="flex flex-wrap gap-3">
          {BG_COLORS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => pickBg(value)}
              title={label}
              className={swatchCls(bg === value)}
              style={{ backgroundColor: value }}
            >
              <span className={`block h-full w-full rounded-xl ${LIGHT.has(value) ? lightBorder : darkBorder}`} />
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-body font-semibold text-gray-300 mb-3">Цвет шрифта</h3>
        <div className="flex flex-wrap gap-3">
          {TEXT_COLORS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => pickText(value)}
              title={label}
              className={swatchCls(text === value)}
              style={{ backgroundColor: value }}
            >
              <span className={`block h-full w-full rounded-xl ${LIGHT.has(value) ? lightBorder : darkBorder}`} />
            </button>
          ))}
        </div>
      </section>

      {/* Live preview */}
      <div className="rounded-xl px-5 py-4 border border-white/8 transition-colors duration-300"
        style={{ backgroundColor: bg, color: text }}>
        <p className="font-semibold" style={{ fontSize: 14 }}>SlimWay OS — предпросмотр</p>
        <p style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
          Так будет выглядеть текст на выбранном фоне.
        </p>
      </div>
    </div>
  );
}
