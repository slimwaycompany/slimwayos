import React, { useState, useEffect, useCallback } from 'react'
import { Search, X, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { bookingsV2Api } from '../../api/schedule-slots.api'
import { PageHeader } from '../../components/layout/PageHeader'
import type { BookingLogEntry, BookingSource } from '../../types'

const TODAY = new Date().toISOString().slice(0, 10)

const SOURCE_LABELS: Record<BookingSource, string> = {
  crm:           'CRM',
  client_portal: 'Портал',
  public_widget: 'Виджет',
}

const SOURCE_COLORS: Record<BookingSource, string> = {
  crm:           'var(--color-info)',
  client_portal: 'var(--color-success)',
  public_widget: 'var(--accent)',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Ожидание',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'var(--color-warning)',
  confirmed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
}

const SLOT_TYPE_LABELS: Record<string, string> = {
  cardio:   'Кардио',
  strength: 'Силовой',
  pool:     'Бассейн',
}

const PER_PAGE = 50

function formatTime(t: string) {
  return t?.slice(0, 5) ?? ''
}

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function formatDateTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      background: color + '22',
      color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export default function ScheduleBookingsPage() {
  const [dateFrom, setDateFrom]     = useState(TODAY)
  const [dateTo,   setDateTo]       = useState(TODAY)
  const [slotType, setSlotType]     = useState('')
  const [clientQ,  setClientQ]      = useState('')
  const [status,   setStatus]       = useState('')
  const [page,     setPage]         = useState(1)

  const [entries, setEntries]   = useState<BookingLogEntry[]>([])
  const [total,   setTotal]     = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const load = useCallback(async (p = page) => {
    setLoading(true)
    setError(null)
    try {
      const res = await bookingsV2Api.getLog({
        date_from: dateFrom || undefined,
        date_to:   dateTo   || undefined,
        slot_type: slotType || undefined,
        client:    clientQ  || undefined,
        status:    status   || undefined,
        page:      p,
        per_page:  PER_PAGE,
      })
      setEntries(res.data)
      setTotal(res.total)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, slotType, clientQ, status, page])

  useEffect(() => {
    load(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function handleSearch() {
    setPage(1)
    load(1)
  }

  function handleReset() {
    setDateFrom(TODAY)
    setDateTo(TODAY)
    setSlotType('')
    setClientQ('')
    setStatus('')
    setPage(1)
    setTimeout(() => load(1), 0)
  }

  function exportExcel() {
    const rows: string[][] = [
      ['#', 'Создана', 'Клиент', 'Телефон', 'Тип', 'Дата', 'Время', 'Тренажёр', 'Источник', 'Статус'],
      ...entries.map((e, i) => [
        String((page - 1) * PER_PAGE + i + 1),
        formatDateTime(e.created_at),
        e.clients?.full_name ?? '',
        e.clients?.phone ?? '',
        e.schedule_slots?.devices?.type ? (SLOT_TYPE_LABELS[e.schedule_slots.devices.type] ?? e.schedule_slots.devices.type) : '',
        formatDate(e.date),
        e.schedule_slots ? `${formatTime(e.schedule_slots.time_start)}–${formatTime(e.schedule_slots.time_end)}` : '',
        e.schedule_slots?.devices?.number ?? '',
        e.source ? (SOURCE_LABELS[e.source] ?? e.source) : '',
        STATUS_LABELS[e.status] ?? e.status,
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `bookings_${dateFrom}_${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputStyle: React.CSSProperties = {
    height: 36,
    padding: '0 10px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    paddingRight: 28,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <PageHeader title="Записи" />

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>С</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>По</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>

        <select value={slotType} onChange={e => setSlotType(e.target.value)} style={selectStyle}>
          <option value="">Все типы</option>
          <option value="cardio">Кардио</option>
          <option value="strength">Силовой</option>
          <option value="pool">Бассейн</option>
        </select>

        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
          <option value="">Все статусы</option>
          <option value="pending">Ожидание</option>
          <option value="confirmed">Подтверждена</option>
          <option value="cancelled">Отменена</option>
        </select>

        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
          <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Поиск клиента…"
            value={clientQ}
            onChange={e => setClientQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ ...inputStyle, width: '100%', paddingLeft: 30, boxSizing: 'border-box' }}
          />
          {clientQ && (
            <button onClick={() => setClientQ('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
              <X size={12} />
            </button>
          )}
        </div>

        <button
          onClick={handleSearch}
          style={{ height: 36, padding: '0 14px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Найти
        </button>

        <button
          onClick={handleReset}
          style={{ height: 36, padding: '0 14px', background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, cursor: 'pointer' }}
        >
          Сбросить
        </button>

        <button
          onClick={exportExcel}
          style={{ height: 36, padding: '0 14px', background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}
        >
          <Download size={14} />
          Excel
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {error && (
          <div style={{ margin: 16, padding: 12, background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}>
              {['#', 'Создана', 'Клиент', 'Телефон', 'Тип', 'Дата', 'Время', 'Тренажёр', 'Источник', 'Статус'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Загрузка…
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Нет записей
                </td>
              </tr>
            )}
            {!loading && entries.map((e, i) => {
              const slot = e.schedule_slots
              const dev  = slot?.devices
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                    {(page - 1) * PER_PAGE + i + 1}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {formatDateTime(e.created_at)}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--text)' }}>
                    {e.clients?.full_name ?? '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {e.clients?.phone ?? '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                    {dev?.type ? (SLOT_TYPE_LABELS[dev.type] ?? dev.type) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {formatDate(e.date)}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {slot ? `${formatTime(slot.time_start)}–${formatTime(slot.time_end)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                    {dev?.number ?? '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {e.source
                      ? <Badge label={SOURCE_LABELS[e.source] ?? e.source} color={SOURCE_COLORS[e.source] ?? 'var(--text-muted)'} />
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge label={STATUS_LABELS[e.status] ?? e.status} color={STATUS_COLORS[e.status] ?? 'var(--text-muted)'} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        flexShrink: 0,
        fontSize: 13,
        color: 'var(--text-muted)',
      }}>
        <span>Всего: {total}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 8px', cursor: page <= 1 ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: page <= 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ minWidth: 80, textAlign: 'center' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 8px', cursor: page >= totalPages ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: page >= totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
