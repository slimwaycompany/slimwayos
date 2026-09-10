'use client';

import { ChevronRight } from 'lucide-react';

/* ─── Report categories ──────────────────────────────────────────────────── */

interface ReportItem { label: string }

interface ReportCategory {
  title: string;
  color: string;
  items: ReportItem[];
}

const CATEGORIES: ReportCategory[] = [
  {
    title: 'Клуб',
    color: 'var(--accent)',
    items: [
      { label: 'Посещаемость' },
      { label: 'Загрузка оборудования' },
      { label: 'Расписание и бронирование' },
    ],
  },
  {
    title: 'Клиенты',
    color: 'var(--color-info)',
    items: [
      { label: 'Активные клиенты' },
      { label: 'Новые регистрации' },
      { label: 'Отток клиентов' },
      { label: 'LTV клиентов' },
      { label: 'Источники привлечения' },
      { label: 'Дни рождения' },
      { label: 'Заморозки абонементов' },
    ],
  },
  {
    title: 'Менеджеры',
    color: 'var(--color-success)',
    items: [
      { label: 'Продажи по менеджерам' },
      { label: 'Лучший продавец' },
      { label: 'Конверсия лидов' },
      { label: 'Выполнение плана' },
      { label: 'Время на задачах' },
      { label: 'NPS от клиентов' },
    ],
  },
  {
    title: 'Тренеры',
    color: 'var(--color-warning)',
    items: [
      { label: 'Нагрузка тренеров' },
      { label: 'Рейтинг тренеров' },
      { label: 'Записи на тренировки' },
      { label: 'Эффективность занятий' },
      { label: 'Отзывы клиентов' },
    ],
  },
  {
    title: 'Финансы',
    color: 'var(--color-danger)',
    items: [
      { label: 'Выручка' },
      { label: 'Продажи за период' },
      { label: 'Касса (нал / безнал)' },
      { label: 'Абонементы' },
      { label: 'Услуги' },
      { label: 'Расходы' },
      { label: 'Прибыль' },
      { label: 'Долги клиентов' },
      { label: 'Возвраты' },
      { label: 'Средний чек' },
      { label: 'Выполнение плана продаж' },
      { label: 'Бюджет маркетинга' },
      { label: 'ROI рекламы' },
      { label: 'Дебиторская задолженность' },
      { label: 'Кредиторская задолженность' },
      { label: 'Зарплатный фонд' },
      { label: 'Аренда и коммунальные' },
      { label: 'Налоги' },
      { label: 'Финансовый отчёт за период' },
    ],
  },
  {
    title: 'Маркетинг',
    color: 'var(--color-info)',
    items: [
      { label: 'Лиды' },
      { label: 'Источники клиентов' },
      { label: 'Конверсия лид → пробное' },
      { label: 'Конверсия пробное → покупка' },
      { label: 'Расходы на рекламу' },
      { label: 'Цена привлечения (CPL)' },
      { label: 'Рекламные каналы' },
      { label: 'Воронка продаж' },
      { label: 'A/B тесты' },
    ],
  },
];

/* ─── Report item ─────────────────────────────────────────────────────────── */

function ReportRow({ label }: { label: string }) {
  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        background: 'transparent',
        cursor: 'not-allowed',
        textAlign: 'left',
        transition: 'background 150ms ease-out',
        opacity: 0.75,
      }}
      title="В разработке"
      disabled
    >
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 400 }}>{label}</span>
      <ChevronRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
    </button>
  );
}

/* ─── Category column ─────────────────────────────────────────────────────── */

function CategoryColumn({ cat }: { cat: ReportCategory }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: '10px 10px 0 0',
          background: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
          borderBottom: `2px solid color-mix(in srgb, ${cat.color} 40%, transparent)`,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {cat.title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{cat.items.length}</span>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {cat.items.map((item) => (
          <ReportRow key={item.label} label={item.label} />
        ))}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Аналитика</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Выберите категорию отчёта</p>
      </div>

      {/* Notice */}
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'color-mix(in srgb, var(--color-info) 8%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-info) 20%, transparent)',
        fontSize: 12,
        color: 'var(--text-muted)',
        marginBottom: 24,
      }}>
        Отчёты в разработке — раздел формируется. Модуль Маркетинг уже доступен в Hub.
      </div>

      {/* 6-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12,
          flex: 1,
          alignItems: 'start',
          overflowY: 'auto',
        }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryColumn key={cat.title} cat={cat} />
        ))}
      </div>
    </div>
  );
}
