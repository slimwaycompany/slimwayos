'use client';

import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, Megaphone, Star, Cake, BarChart2,
  ArrowUpRight, ArrowDownRight, Minus, Download,
  PieChart, Calendar, MousePointer, Percent,
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

function useMarketing<T>(endpoint: string, params?: string): Block<T> {
  const [data, setData]     = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const url = `${API}/marketing/${endpoint}${params ? '?' + params : ''}`;
  useEffect(() => {
    fetch(url, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [url]);
  return { data, loading };
}

/* ─── Sparkline ───────────────────────────────────────────────────────────── */

function Sparkline({ values, color = 'var(--accent)' }: { values: number[]; color?: string }) {
  if (!values.length) return null;
  const W = 200, H = 48;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / max) * (H - 4) - 2;
    return `${x},${y}`;
  });
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

function MetricCard({ icon: Icon, label, value, sub, trend, color = 'var(--accent)', loading, children }: MetricCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
  const trendClass = trend === undefined ? '' : trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-500';

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-caption font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        </div>
        {TrendIcon && (
          <span className={`flex items-center gap-0.5 text-caption font-semibold ${trendClass}`}>
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

/* ─── Section header ──────────────────────────────────────────────────────── */

function SectionTitle({ label }: { label: string }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, marginTop: 28 }}>
      {label}
    </h3>
  );
}

/* ─── Excel export ────────────────────────────────────────────────────────── */

async function exportToExcel(data: Record<string, unknown>[]) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Маркетинг');
  XLSX.writeFile(wb, `marketing_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/* ─── Period filter ───────────────────────────────────────────────────────── */

type Period = 'today' | 'week' | 'month';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week',  label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
];

/* ─── Source colors ───────────────────────────────────────────────────────── */

const SOURCE_COLORS: Record<string, string> = {
  instagram:       'var(--accent)',
  site:            'var(--color-info)',
  recommendation:  'var(--color-success)',
  lead:            'var(--color-warning)',
  call:            'var(--color-danger)',
  whatsapp:        'var(--color-success)',
  other:           'var(--text-muted)',
};

const SOURCE_LABELS: Record<string, string> = {
  instagram:       'Instagram',
  site:            'Сайт',
  recommendation:  'Рекомендация',
  lead:            'Лид',
  call:            'Звонок',
  whatsapp:        'WhatsApp',
  other:           'Другое',
};

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ClientSource { source: string; count: number }
interface SalesPeriod  { total: number; cash: number; card: number; count: number }
interface SpendItem    { channel: string; amount: number; leads: number }
interface Conversions  { lead_to_trial: number; trial_to_purchase: number; total_leads: number; total_trials: number; total_purchases: number }

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function MarketingPage() {
  const [period, setPeriod] = useState<Period>('month');

  /* KPI from dashboard */
  const memberships = useDash<{ count: number }>('active-memberships');
  const sales       = useDash<{ total: number; plan: number; percent: number | null }>('sales-summary');
  const marketing   = useDash<{ leads: number; converted: number; conversion: number }>('marketing-summary');
  const topSeller   = useDash<{ name: string; total: number } | null>('top-seller');
  const birthdays   = useDash<{ id: string; first_name: string; last_name: string; days_until: number }[]>('birthdays');

  /* Marketing-specific */
  const sources     = useMarketing<ClientSource[]>('client-sources');
  const conversions = useMarketing<Conversions>('conversions');
  const spendData   = useMarketing<SpendItem[]>('spend');

  /* Sales by period */
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo]   = useState(() => today.toISOString().slice(0, 10));
  const [periodSales, setPeriodSales] = useState<SalesPeriod | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);

  const loadPeriodSales = async () => {
    setPeriodLoading(true);
    try {
      const res = await fetch(`${API}/marketing/sales-by-period?from=${dateFrom}&to=${dateTo}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setPeriodSales(await res.json() as SalesPeriod);
    } catch {
      setPeriodSales(null);
    } finally {
      setPeriodLoading(false);
    }
  };

  /* Ad spend state */
  const [spendChannel, setSpendChannel] = useState('');
  const [spendAmount, setSpendAmount]   = useState('');
  const [spendLeads, setSpendLeads]     = useState('');
  const [savingSpend, setSavingSpend]   = useState(false);

  const handleAddSpend = async () => {
    if (!spendChannel.trim() || !spendAmount) return;
    setSavingSpend(true);
    try {
      await fetch(`${API}/marketing/spend`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: spendChannel, amount: Number(spendAmount), leads: Number(spendLeads) || 0 }),
      });
      setSpendChannel(''); setSpendAmount(''); setSpendLeads('');
    } catch { /* graceful */ }
    finally { setSavingSpend(false); }
  };

  const fmtMoney = (n: number) => n.toLocaleString('ru-RU') + ' ₸';

  const exportData = () => {
    const rows: Record<string, unknown>[] = [
      { Показатель: 'Активные абонементы', Значение: memberships.data?.count ?? '—' },
      { Показатель: 'Продажи за месяц', Значение: sales.data?.total ?? '—' },
      { Показатель: 'Лидов за месяц', Значение: marketing.data?.leads ?? '—' },
      { Показатель: 'Конверсия (%)', Значение: marketing.data?.conversion ?? '—' },
      { Показатель: 'Лучший продавец', Значение: topSeller.data?.name ?? '—' },
    ];
    void exportToExcel(rows);
  };

  const inputStyle: React.CSSProperties = {
    height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text)', fontSize: 13, padding: '0 10px', outline: 'none',
  };

  /* Total spend and avg CPL */
  const totalSpend = (spendData.data ?? []).reduce((s, x) => s + x.amount, 0);
  const totalLeads = (spendData.data ?? []).reduce((s, x) => s + x.leads, 0);
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;

  /* Source totals for bar widths */
  const srcTotal = (sources.data ?? []).reduce((s, x) => s + x.count, 0);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Маркетинг</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Ключевые показатели и управление рекламой</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                height: 32, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: period === p.id ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'color-mix(in srgb, var(--text) 4%, transparent)',
                border: `1px solid ${period === p.id ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border)'}`,
                color: period === p.id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={exportData}
            style={{ height: 32, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <Download size={13} />
            Excel
          </button>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <MetricCard icon={Users} label="Активные абонементы" value={memberships.data?.count ?? 0} sub="клиентов сейчас" loading={memberships.loading} />

        <MetricCard icon={TrendingUp} label="Продажи" color="var(--color-warning)"
          value={`${(sales.data?.total ?? 0).toLocaleString('ru')} ₸`}
          sub={(sales.data?.plan ?? 0) > 0 ? `${sales.data?.percent ?? 0}% от плана` : 'план не задан'}
          loading={sales.loading}
        >
          {!sales.loading && (sales.data?.plan ?? 0) > 0 && (
            <div style={{ marginTop: 4, height: 6, width: '100%', overflow: 'hidden', borderRadius: 999, background: 'color-mix(in srgb, var(--text) 8%, transparent)' }}>
              <div style={{ height: '100%', borderRadius: 999, width: `${Math.min(sales.data!.percent ?? 0, 100)}%`, background: (sales.data?.percent ?? 0) >= 100 ? 'var(--color-success)' : 'var(--color-warning)', transition: 'width 500ms ease-out' }} />
            </div>
          )}
        </MetricCard>

        <MetricCard icon={Megaphone} label="Лиды" color="var(--color-info)"
          value={marketing.data?.leads ?? 0}
          sub={`конверсия ${marketing.data?.conversion ?? 0}%`}
          loading={marketing.loading}
        />

        <MetricCard icon={Star} label="Лучший продавец" color="var(--color-warning)"
          value={topSeller.data?.name ?? '—'}
          sub={topSeller.data ? `${topSeller.data.total.toLocaleString('ru')} ₸` : 'нет данных'}
          loading={topSeller.loading}
        />

        <MetricCard icon={Cake} label="Дни рождения" color="var(--color-danger)"
          value={birthdays.data?.length ?? 0}
          sub="именинников на этой неделе"
          loading={birthdays.loading}
        >
          {!birthdays.loading && !!birthdays.data?.length && (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {birthdays.data.slice(0, 3).map((p) => (
                <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text)' }}>{p.first_name} {p.last_name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{p.days_until === 0 ? 'сегодня' : `через ${p.days_until} дн.`}</span>
                </li>
              ))}
            </ul>
          )}
        </MetricCard>

        <MetricCard icon={BarChart2} label="Тренд (30 дней)" value="—" sub="данные накапливаются" loading={false}>
          <Sparkline values={[12, 18, 14, 22, 19, 30, 25, 28, 32, 29, 35, 40]} />
        </MetricCard>
      </div>

      {/* ── Клиенты по источникам ── */}
      <SectionTitle label="Клиенты по источникам" />
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <PieChart size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Источники привлечения</span>
        </div>
        {sources.loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>
        ) : sources.data && sources.data.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sources.data.map((s) => {
              const pct = srcTotal > 0 ? Math.round((s.count / srcTotal) * 100) : 0;
              const clr = SOURCE_COLORS[s.source] ?? 'var(--text-muted)';
              return (
                <div key={s.source}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text)' }}>{SOURCE_LABELS[s.source] ?? s.source}</span>
                    <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{s.count} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'color-mix(in srgb, var(--text) 6%, transparent)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: clr, transition: 'width 400ms ease-out' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
            API не подключён — данные появятся после настройки эндпоинта /marketing/client-sources
          </div>
        )}
      </div>

      {/* ── Продажи за период ── */}
      <SectionTitle label="Продажи за период" />
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Calendar size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Выберите период</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>С</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>По</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <button
            onClick={() => void loadPeriodSales()}
            disabled={periodLoading}
            style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 600, cursor: periodLoading ? 'not-allowed' : 'pointer', opacity: periodLoading ? 0.7 : 1 }}
          >
            {periodLoading ? '...' : 'Показать'}
          </button>
        </div>
        {periodSales && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
            {[
              { label: 'Итого', value: fmtMoney(periodSales.total) },
              { label: 'Наличных', value: fmtMoney(periodSales.cash) },
              { label: 'Безналичных', value: fmtMoney(periodSales.card) },
              { label: 'Транзакций', value: String(periodSales.count) },
            ].map((cell) => (
              <div key={cell.label} style={{ background: 'color-mix(in srgb, var(--text) 4%, transparent)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{cell.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{cell.value}</div>
              </div>
            ))}
          </div>
        )}
        {!periodSales && !periodLoading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>Выберите период и нажмите «Показать»</div>
        )}
      </div>

      {/* ── Реклама ── */}
      <SectionTitle label="Расходы на рекламу" />
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <MousePointer size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Рекламные каналы</span>
          {totalLeads > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
              Средний CPL: <strong style={{ color: 'var(--text)' }}>{fmtMoney(Math.round(avgCPL))}</strong>
            </span>
          )}
        </div>

        {/* Add channel form */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Канал</label>
            <input
              type="text" placeholder="Instagram, Яндекс..."
              value={spendChannel} onChange={(e) => setSpendChannel(e.target.value)}
              style={{ ...inputStyle, width: 160 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Расход (₸)</label>
            <input
              type="number" min={0} placeholder="0"
              value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)}
              style={{ ...inputStyle, width: 120, fontVariantNumeric: 'tabular-nums' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Лидов</label>
            <input
              type="number" min={0} placeholder="0"
              value={spendLeads} onChange={(e) => setSpendLeads(e.target.value)}
              style={{ ...inputStyle, width: 90, fontVariantNumeric: 'tabular-nums' }}
            />
          </div>
          <button
            onClick={() => void handleAddSpend()}
            disabled={savingSpend || !spendChannel.trim()}
            style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 600, cursor: savingSpend || !spendChannel.trim() ? 'not-allowed' : 'pointer', opacity: savingSpend || !spendChannel.trim() ? 0.5 : 1 }}
          >
            Добавить
          </button>
        </div>

        {spendData.loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>
        ) : spendData.data && spendData.data.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Канал', 'Расход', 'Лидов', 'CPL'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spendData.data.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 50%, transparent)' }}>
                  <td style={{ padding: '8px', color: 'var(--text)', fontWeight: 500 }}>{row.channel}</td>
                  <td style={{ padding: '8px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(row.amount)}</td>
                  <td style={{ padding: '8px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{row.leads}</td>
                  <td style={{ padding: '8px', color: row.leads > 0 ? 'var(--color-warning)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.leads > 0 ? fmtMoney(Math.round(row.amount / row.leads)) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Добавьте расходы по рекламным каналам выше</div>
        )}
      </div>

      {/* ── Конверсии ── */}
      <SectionTitle label="Конверсии" />
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Percent size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Воронка конверсии</span>
        </div>
        {conversions.loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>
        ) : conversions.data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                label: 'Лид → Пробное занятие',
                pct: conversions.data.lead_to_trial,
                from: conversions.data.total_leads,
                to: conversions.data.total_trials,
                color: 'var(--accent)',
              },
              {
                label: 'Пробное → Покупка абонемента',
                pct: conversions.data.trial_to_purchase,
                from: conversions.data.total_trials,
                to: conversions.data.total_purchases,
                color: 'var(--color-success)',
              },
            ].map((step) => (
              <div key={step.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{step.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: step.color, fontVariantNumeric: 'tabular-nums' }}>
                    {step.pct.toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'color-mix(in srgb, var(--text) 6%, transparent)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, width: `${Math.min(step.pct, 100)}%`, background: step.color, transition: 'width 500ms ease-out' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {step.from} → {step.to}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
            API не подключён — данные появятся после настройки эндпоинта /marketing/conversions
          </div>
        )}
      </div>
    </div>
  );
}
