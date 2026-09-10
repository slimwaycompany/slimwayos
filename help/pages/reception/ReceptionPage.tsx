import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { receptionApi, type ReceptionEntry, type ReceptionSearchResult } from '../../api/reception.api'
import { supabase } from '../../lib/supabase'
import {
  Search, X, UserCheck, LogOut, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'

const fmt12h = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('ru-KZ', { hour: '2-digit', minute: '2-digit' })
}

function elapsed(checkedInAt: string): string {
  const diff = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (h > 0) return `${h}ч ${m}м`
  return `${m}м`
}

// ─── LiveTimer ────────────────────────────────────────────────────────────────

function LiveTimer({ checkedInAt }: { checkedInAt: string }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])
  return <>{elapsed(checkedInAt)}</>
}

// ─── ClientPanel ──────────────────────────────────────────────────────────────

interface ClientPanelProps {
  client: ReceptionSearchResult
  onCheckin: (clientId: string, bookingId?: string) => Promise<void>
  onClose: () => void
}

function ClientPanel({ client, onCheckin, onClose }: ClientPanelProps) {
  const [selectedBooking, setSelectedBooking] = useState<string | undefined>(
    client.today_bookings.length === 1 ? client.today_bookings[0].id : undefined
  )
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleCheckin = async () => {
    setLoading(true)
    setError(null)
    try {
      await onCheckin(client.id, selectedBooking)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Ошибка при чекине')
    } finally {
      setLoading(false)
    }
  }

  const sub = client.active_subscription

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 20, marginTop: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{client.full_name}</div>
          {client.phone && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{client.phone}</div>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Subscription */}
      <div style={{
        background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 12,
        border: sub ? '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)' : '1px solid var(--border)',
      }}>
        {sub ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} color="var(--color-success)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sub.name}</div>
              {sub.slot_1_sessions_left !== null && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  Осталось: {sub.slot_1_sessions_left} визитов
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет активного абонемента</div>
        )}
      </div>

      {/* Today's bookings */}
      {client.today_bookings.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>ЗАПИСЬ НА СЕГОДНЯ</div>
          {client.today_bookings.map(b => (
            <label key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer',
              background: selectedBooking === b.id
                ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                : 'var(--bg)',
              border: `1px solid ${selectedBooking === b.id ? 'var(--accent)' : 'var(--border)'}`,
              transition: 'background 120ms ease-out, border-color 120ms ease-out',
            }}>
              <input
                type="radio"
                name="booking"
                checked={selectedBooking === b.id}
                onChange={() => setSelectedBooking(b.id)}
                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text)' }}>
                {b.schedule_slots
                  ? `${b.schedule_slots.time_start.slice(0, 5)} – ${b.schedule_slots.time_end.slice(0, 5)}`
                  : 'Без слота'}
              </span>
              <span style={{
                fontSize: 11, padding: '1px 7px', borderRadius: 99,
                background: b.status === 'confirmed'
                  ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
                  : 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
                color: b.status === 'confirmed' ? 'var(--color-success)' : 'var(--text-muted)',
              }}>
                {b.status === 'confirmed' ? 'подтверждена' : b.status === 'pending' ? 'ожидает' : b.status}
              </span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-danger)', marginBottom: 10 }}>
          <AlertCircle size={13} />{error}
        </div>
      )}

      <button
        onClick={() => void handleCheckin()}
        disabled={loading}
        style={{
          width: '100%', height: 42,
          background: 'var(--accent)', border: 'none', borderRadius: 10,
          color: 'var(--accent-fg)', fontSize: 14, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'opacity 150ms ease-out',
        }}
      >
        <UserCheck size={16} />
        {loading ? 'Чекин...' : 'Чекин'}
      </button>
    </div>
  )
}

// ─── ReceptionPage ────────────────────────────────────────────────────────────

export default function ReceptionPage() {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<ReceptionSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected,  setSelected]  = useState<ReceptionSearchResult | null>(null)

  const [current,   setCurrent]   = useState<ReceptionEntry[]>([])
  const [loadingCurrent, setLoadingCurrent] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  const loadCurrent = useCallback(async () => {
    setLoadingCurrent(true)
    try {
      const data = await receptionApi.getCurrent()
      setCurrent(data)
    } catch { /* ignore */ } finally {
      setLoadingCurrent(false)
    }
  }, [])

  useEffect(() => { void loadCurrent() }, [loadCurrent])

  // Supabase Realtime subscription on reception_log
  useEffect(() => {
    const channel = supabase
      .channel('reception_log_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reception_log',
      }, () => { void loadCurrent() })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [loadCurrent])

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceTimer.current)
    if (!query.trim()) { setResults([]); return }
    debounceTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await receptionApi.search(query)
        setResults(data)
      } catch { setResults([]) } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(debounceTimer.current)
  }, [query])

  const handleCheckin = async (clientId: string, bookingId?: string) => {
    await receptionApi.checkin({ client_id: clientId, booking_id: bookingId })
    setSelected(null)
    setQuery('')
    setResults([])
    await loadCurrent()
  }

  const handleCheckout = async (id: string) => {
    setCheckingOut(id)
    try {
      await receptionApi.checkout(id)
      setCurrent(prev => prev.filter(e => e.id !== id))
    } catch { /* ignore */ } finally {
      setCheckingOut(null)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Ресепшен" />

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 520, marginBottom: 4 }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
        />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          placeholder="Поиск клиента по имени или телефону..."
          style={{
            height: 46, width: '100%', boxSizing: 'border-box',
            paddingLeft: 44, paddingRight: query ? 40 : 16,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none',
            transition: 'border-color 150ms ease-out',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setSelected(null) }}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {query.trim() && !selected && (
        <div style={{
          maxWidth: 520, background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', marginBottom: 16, overflow: 'hidden',
        }}>
          {searching ? (
            <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>Поиск...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>Клиенты не найдены</div>
          ) : results.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelected(c); setResults([]) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '10px 16px', textAlign: 'left',
                background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', transition: 'background 100ms ease-out',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, color: 'var(--accent)',
              }}>
                {c.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{c.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {c.phone ?? '—'}
                  {c.active_subscription && (
                    <span style={{ marginLeft: 8, color: 'var(--color-success)' }}>● {c.active_subscription.name}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Client panel */}
      {selected && (
        <div style={{ maxWidth: 520, marginBottom: 24 }}>
          <ClientPanel
            client={selected}
            onCheckin={handleCheckin}
            onClose={() => { setSelected(null); setQuery('') }}
          />
        </div>
      )}

      {/* Currently in club */}
      <div style={{ marginTop: selected ? 0 : 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
          Сейчас в клубе
          {current.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
              {current.length} чел.
            </span>
          )}
        </div>

        {loadingCurrent ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Загрузка...</div>
        ) : current.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '32px 24px', textAlign: 'center',
            fontSize: 13, color: 'var(--text-muted)',
          }}>
            В клубе пока никого нет
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Клиент', 'Чекин', 'Время в зале', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                        {entry.clients.full_name}
                      </div>
                      {entry.clients.phone && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                          {entry.clients.phone}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        {fmt12h(entry.checked_in_at)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        <LiveTimer checkedInAt={entry.checked_in_at} />
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => void handleCheckout(entry.id)}
                        disabled={checkingOut === entry.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          height: 30, padding: '0 12px',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: 8, fontSize: 12, fontWeight: 500,
                          color: 'var(--text-muted)', cursor: checkingOut === entry.id ? 'not-allowed' : 'pointer',
                          opacity: checkingOut === entry.id ? 0.5 : 1,
                          transition: 'border-color 120ms ease-out, color 120ms ease-out',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-danger)'; e.currentTarget.style.color = 'var(--color-danger)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                      >
                        <LogOut size={12} />
                        {checkingOut === entry.id ? '...' : 'Выход'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
