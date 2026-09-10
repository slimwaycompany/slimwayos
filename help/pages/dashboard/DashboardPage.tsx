import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Users, DollarSign, TrendingUp, CheckSquare, UserCheck, Package, BarChart2, AlertCircle, Bookmark, CreditCard, Calendar } from 'lucide-react'
import { analyticsApi } from '../../api/analytics.api'
import { badgesApi } from '../../api/badges.api'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { BranchSelector } from '../../components/ui/BranchSelector'
import { PeriodFilter } from '../../components/ui/PeriodFilter'
import type { AnalyticsOverview, Badges } from '../../types'

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: string
  loading?: boolean
}

function MetricCard({ icon: Icon, label, value, sub, color = 'var(--accent)', loading }: MetricCardProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
      flex: '1 1 0', minWidth: 0,
      transition: 'border-color 150ms ease-out',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, lineHeight: '16px' }}>{label}</span>
        <div style={{
          width: 30, height: 30, borderRadius: 'var(--radius-sm)',
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} strokeWidth={1.75} style={{ color }} />
        </div>
      </div>
      {loading
        ? <div style={{ height: 28, borderRadius: 6, background: 'var(--border)', width: '60%' }} />
        : (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
          </div>
        )
      }
    </div>
  )
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const perm = usePermissions()
  const { period, customFrom, customTo, dateFromStr, dateToStr, setPeriod, remember, setRemember } = usePeriodFilter('dashboard')

  const [selectedBranches, setSelectedBranches] = useState<string[]>(() => {
    const id = localStorage.getItem('activeBranchId')
    return id ? [id] : []
  })

  const [badges, setBadges] = useState<Badges | null>(null)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const branchId = selectedBranches[0]
    Promise.all([
      badgesApi.get().catch(() => null),
      perm.can('analytics', 'view')
        ? analyticsApi.getOverview({
            branch_id: branchId,
            from: dateFromStr,
            to: dateToStr,
          }).catch(() => null)
        : Promise.resolve(null),
    ]).then(([b, o]) => {
      if (b) setBadges(b)
      if (o) setOverview(o)
    }).finally(() => setLoading(false))
  }, [selectedBranches, dateFromStr, dateToStr]) // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n: number | undefined | null, prefix = '') =>
    n == null ? '—' : `${prefix}${n.toLocaleString('ru-RU')}`

  const pct = (cur: number | undefined, prev: number | undefined) => {
    if (!prev || !cur) return undefined
    const diff = Math.round(((cur - prev) / prev) * 100)
    return `${diff >= 0 ? '+' : ''}${diff}% vs прошлый`
  }

  // Build 30-day chart data
  const chartData = React.useMemo(() => {
    const today = new Date()
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (29 - i))
      return {
        day: d.getDate().toString(),
        visits: overview?.visits_by_day?.[i] ?? 0,
        clients: overview?.clients_by_day?.[i] ?? 0,
      }
    })
  }, [overview])

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Рабочий стол</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {user?.fullName ? `Добро пожаловать, ${user.fullName.split(' ')[0]}` : 'Обзор показателей'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {user?.role && (
            <BranchSelector role={user.role} selectedIds={selectedBranches} onChange={setSelectedBranches} />
          )}
          <PeriodFilter
            period={period}
            customFrom={customFrom}
            customTo={customTo}
            remember={remember}
            onChange={setPeriod}
            onRememberChange={setRemember}
          />
        </div>
      </div>

      {/* Metric cards — row 1 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <MetricCard
          icon={Users} label="Всего клиентов"
          value={fmt(badges?.clients_total)}
          sub={pct(badges?.clients_new_month, badges?.clients_new_prev_month)}
          color="var(--accent)" loading={loading}
        />
        <MetricCard
          icon={TrendingUp} label="Новых заявок"
          value={fmt(badges?.leads_new)}
          sub={badges?.leads_total_month != null ? `${badges.leads_total_month} в месяце` : undefined}
          color="var(--color-info)" loading={loading}
        />
        <MetricCard
          icon={CreditCard} label="Активных абонементов"
          value={fmt(badges?.subscriptions_active)}
          sub={badges?.subscriptions_expiring_7d ? `${badges.subscriptions_expiring_7d} истекает` : undefined}
          color="var(--color-success)" loading={loading}
        />
        <MetricCard
          icon={DollarSign} label="Выручка за период"
          value={fmt(badges?.revenue_month, '₸')}
          sub={pct(badges?.revenue_month, badges?.revenue_prev_month)}
          color="var(--color-warning)" loading={loading}
        />
        <MetricCard
          icon={Calendar} label="Посещений сегодня"
          value={fmt(badges?.visits_today)}
          sub={badges?.schedule_slots_today != null ? `из ${badges.schedule_slots_today} слотов` : undefined}
          color="var(--color-info)" loading={loading}
        />
        <MetricCard
          icon={Bookmark} label="Ожидают подтверждения"
          value={fmt(badges?.pending_bookings)}
          color="var(--color-warning)" loading={loading}
        />
      </div>

      {/* Metric cards — row 2 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <MetricCard
          icon={UserCheck} label="Сотрудников на смене"
          value={fmt(badges?.employees_on_shift)}
          color="var(--accent)" loading={loading}
        />
        <MetricCard
          icon={CheckSquare} label="Задач просрочено"
          value={fmt(badges?.tasks_overdue)}
          color={badges?.tasks_overdue ? 'var(--color-danger)' : 'var(--color-success)'} loading={loading}
        />
        <MetricCard
          icon={AlertCircle} label="Истекает (7 дней)"
          value={fmt(badges?.subscriptions_expiring_7d)}
          color="var(--color-danger)" loading={loading}
        />
        <MetricCard
          icon={Package} label="Мало на складе"
          value={fmt(badges?.low_stock_items)}
          color={badges?.low_stock_items ? 'var(--color-danger)' : 'var(--text-muted)'} loading={loading}
        />
        <MetricCard
          icon={Users} label="Новых клиентов"
          value={fmt(badges?.clients_new_month)}
          sub={pct(badges?.clients_new_month, badges?.clients_new_prev_month)}
          color="var(--color-success)" loading={loading}
        />
        <MetricCard
          icon={BarChart2} label="Конверсия лидов"
          value={
            badges?.leads_total_month && badges?.leads_total_month > 0
              ? `${Math.round(((badges.leads_converted_month ?? 0) / badges.leads_total_month) * 100)}%`
              : '—'
          }
          color="var(--accent)" loading={loading}
        />
      </div>

      {/* Chart */}
      {perm.can('analytics', 'view') && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Динамика за 30 дней</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Посещения и новые клиенты</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <ReTooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--text)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
              />
              <Legend
                iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8 }}
              />
              <Line
                type="monotone" dataKey="visits" name="Посещения"
                stroke="var(--accent)" strokeWidth={2}
                dot={false} activeDot={{ r: 4, stroke: 'var(--accent)', strokeWidth: 2 }}
              />
              <Line
                type="monotone" dataKey="clients" name="Клиенты"
                stroke="var(--color-success)" strokeWidth={2}
                dot={false} activeDot={{ r: 4, stroke: 'var(--color-success)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
