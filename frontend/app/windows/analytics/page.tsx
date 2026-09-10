'use client';

import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, Megaphone, Star, Cake, BarChart2,
  ArrowUpRight, ArrowDownRight, Minus, Download,
} from 'lucide-react';
import { API, authHeaders } from '@/lib/auth';

/* ─── Data hooks ─────────────────────────────────────────────────────────── */

interface Block<T> { data: T | null; loading: boolean }

function useDash<T>(endpoint: string): Block<T> {
  const [data, setData]     = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}/dashboard/${endpoint}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [endpoint]);
  return { data, loading };
}

/* ─── Simple SVG sparkline ────────────────────────────────────────────────── */

function Sparkline({ values, color = '#02BDB6' }: { values: number[]; color?: string }) {
  if (!values.length) return null;
  const W = 200, H = 48;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / max) * (H - 4) - 2;
    return `${x},${y}`;
  });
  const d = `M ${pts.join(' L ')}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mt-2 opacity-70">
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={pts.join(' ')} />
    </svg>
  );
}

/* ─── Metric card ─────────────────────────────────────────────────────────── */

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

function MetricCard({ icon: Icon, label, value, sub, trend, color = '#02BDB6', loading, children }: MetricCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
  const trendColor = trend === undefined ? '' : trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-500';

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${color}1a`, color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-caption font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        </div>
        {TrendIcon && (
          <span className={`flex items-center gap-0.5 text-caption font-semibold ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(trend!)}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded-lg bg-white/5" />
      ) : (
        <div className="flex flex-col gap-0.5">
          <span className="text-subheading font-bold text-gray-100">{value}</span>
          {sub && <span className="text-caption text-gray-500">{sub}</span>}
        </div>
      )}

      {children}
    </div>
  );
}

/* ─── Excel export ────────────────────────────────────────────────────────── */

async function exportToExcel(data: Record<string, unknown>[]) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Аналитика');
  XLSX.writeFile(wb, `analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/* ─── Period filter ───────────────────────────────────────────────────────── */

type Period = 'today' | 'week' | 'month';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week',  label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month');

  const memberships = useDash<{ count: number }>('active-memberships');
  const sales       = useDash<{ total: number; plan: number; percent: number | null }>('sales-summary');
  const marketing   = useDash<{ leads: number; converted: number; conversion: number }>('marketing-summary');
  const topSeller   = useDash<{ name: string; total: number } | null>('top-seller');
  const birthdays   = useDash<{ id: string; first_name: string; last_name: string; days_until: number }[]>('birthdays');

  const exportData = () => {
    const rows: Record<string, unknown>[] = [
      { Показатель: 'Активные абонементы', Значение: memberships.data?.count ?? '—' },
      { Показатель: 'Продажи за месяц (₽)', Значение: sales.data?.total ?? '—' },
      { Показатель: 'Лидов за месяц', Значение: marketing.data?.leads ?? '—' },
      { Показатель: 'Конверсия (%)', Значение: marketing.data?.conversion ?? '—' },
      { Показатель: 'Лучший продавец', Значение: topSeller.data?.name ?? '—' },
    ];
    void exportToExcel(rows);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-subheading text-white">Аналитика</h2>
          <p className="mt-0.5 text-caption text-gray-500">Ключевые показатели</p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className="rounded-lg px-3 py-1.5 text-caption font-medium transition-colors"
              style={{
                background: period === p.id ? 'rgba(2,189,182,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${period === p.id ? 'rgba(2,189,182,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: period === p.id ? '#02BDB6' : '#9ca3af',
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={exportData}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-caption text-gray-400 transition-colors hover:bg-white/8 hover:text-gray-200"
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active memberships */}
        <MetricCard
          icon={Users}
          label="Активные абонементы"
          value={memberships.data?.count ?? 0}
          sub="клиентов сейчас"
          loading={memberships.loading}
        />

        {/* Sales */}
        <MetricCard
          icon={TrendingUp}
          label="Продажи"
          value={`${(sales.data?.total ?? 0).toLocaleString('ru')} ₽`}
          sub={
            (sales.data?.plan ?? 0) > 0
              ? `${sales.data?.percent ?? 0}% от плана (${(sales.data?.plan ?? 0).toLocaleString('ru')} ₽)`
              : 'план не задан'
          }
          color="#F59E0B"
          loading={sales.loading}
        >
          {!sales.loading && (sales.data?.plan ?? 0) > 0 && (
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(sales.data!.percent ?? 0, 100)}%`,
                  background: (sales.data?.percent ?? 0) >= 100 ? '#10B981' : '#F59E0B',
                }}
              />
            </div>
          )}
        </MetricCard>

        {/* Marketing / Leads */}
        <MetricCard
          icon={Megaphone}
          label="Маркетинг"
          value={marketing.data?.leads ?? 0}
          sub={`конверсия ${marketing.data?.conversion ?? 0}%`}
          color="#A78BFA"
          loading={marketing.loading}
        />

        {/* Top seller */}
        <MetricCard
          icon={Star}
          label="Лучший продавец"
          value={topSeller.data?.name ?? '—'}
          sub={topSeller.data ? `${topSeller.data.total.toLocaleString('ru')} ₽` : 'нет данных'}
          color="#F59E0B"
          loading={topSeller.loading}
        />

        {/* Birthdays this week */}
        <MetricCard
          icon={Cake}
          label="Дни рождения"
          value={birthdays.data?.length ?? 0}
          sub="именинников на этой неделе"
          color="#F472B6"
          loading={birthdays.loading}
        >
          {!birthdays.loading && !!birthdays.data?.length && (
            <ul className="flex flex-col gap-1 mt-1">
              {birthdays.data.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-caption">
                  <span className="text-gray-300">{p.first_name} {p.last_name}</span>
                  <span className="text-gray-500">{p.days_until === 0 ? 'сегодня 🎂' : `через ${p.days_until} дн.`}</span>
                </li>
              ))}
            </ul>
          )}
        </MetricCard>

        {/* Trend placeholder */}
        <MetricCard
          icon={BarChart2}
          label="Тренд продаж (30 дней)"
          value="—"
          sub="данные накапливаются"
          loading={false}
        >
          <Sparkline values={[12, 18, 14, 22, 19, 30, 25, 28, 32, 29, 35, 40]} />
        </MetricCard>
      </div>
    </div>
  );
}
