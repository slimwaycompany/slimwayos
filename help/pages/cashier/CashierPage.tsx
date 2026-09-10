import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { cashShiftsApi, type CashShift, type CashShiftTotals } from '../../api/cash-shifts.api'
import SalePage from '../sale/SalePage'
import {
  DollarSign, Banknote, CreditCard, Wallet, X, AlertCircle,
  Clock, ChevronDown,
} from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('ru-KZ').format(n)

const cardSt: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '18px 20px',
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  accent?: boolean
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div style={{
      ...cardSt,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          background: accent
            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
            : 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
          color: accent ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          {icon}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
        {fmt(value)} ₸
      </div>
    </div>
  )
}

// ─── CloseShiftDialog ─────────────────────────────────────────────────────────

interface CloseShiftDialogProps {
  totals: CashShiftTotals
  onClose: () => void
  onConfirm: (closingBalance: number, notes: string) => Promise<void>
}

function CloseShiftDialog({ totals, onClose, onConfirm }: CloseShiftDialogProps) {
  const [actualCash, setActualCash]   = useState(totals.cash_in_drawer)
  const [notes, setNotes]             = useState('')
  const [closing, setClosing]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const diff = actualCash - totals.cash_in_drawer
  const hasDiff = diff !== 0

  const handleConfirm = async () => {
    setClosing(true)
    setError(null)
    try {
      await onConfirm(actualCash, notes)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Ошибка при закрытии смены')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Закрытие смены</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Totals summary */}
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Наличные</span><span style={{ color: 'var(--text)' }}>{fmt(totals.total_cash)} ₸</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Карта</span><span style={{ color: 'var(--text)' }}>{fmt(totals.total_card)} ₸</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <span>Ожидается в кассе</span><span style={{ color: 'var(--text)' }}>{fmt(totals.cash_in_drawer)} ₸</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            <span>Итого выручка</span><span>{fmt(totals.total)} ₸</span>
          </div>
        </div>

        {/* Actual cash field */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            Фактический остаток в кассе (₸)
          </label>
          <input
            type="number"
            value={actualCash}
            onChange={e => setActualCash(Number(e.target.value))}
            style={{
              height: 40, width: '100%', boxSizing: 'border-box',
              padding: '0 13px', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--text)', fontSize: 14, outline: 'none',
            }}
          />
        </div>

        {/* Discrepancy */}
        {hasDiff && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13,
            background: diff > 0
              ? 'color-mix(in srgb, var(--color-success) 8%, transparent)'
              : 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            border: `1px solid ${diff > 0
              ? 'color-mix(in srgb, var(--color-success) 20%, transparent)'
              : 'color-mix(in srgb, var(--color-danger) 20%, transparent)'}`,
            color: diff > 0 ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            <AlertCircle size={13} />
            {diff > 0 ? `Излишек: +${fmt(diff)} ₸` : `Недостача: ${fmt(diff)} ₸`}
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            Комментарий (необязательно)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Пояснение к закрытию..."
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 13px', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: 'var(--color-danger)' }}>
            <AlertCircle size={13} />{error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ height: 38, padding: '0 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            Отмена
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={closing}
            style={{ height: 38, padding: '0 18px', background: 'var(--color-danger)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: closing ? 'not-allowed' : 'pointer', opacity: closing ? 0.7 : 1 }}>
            {closing ? 'Закрытие...' : 'Закрыть смену'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CashierPage ──────────────────────────────────────────────────────────────

export default function CashierPage() {
  const [shift,      setShift]      = useState<CashShift | null | undefined>(undefined)
  const [totals,     setTotals]     = useState<CashShiftTotals | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [opening,    setOpening]    = useState(false)
  const [openBal,    setOpenBal]    = useState(0)
  const [openErr,    setOpenErr]    = useState<string | null>(null)
  const [closeOpen,  setCloseOpen]  = useState(false)

  const loadShift = useCallback(async () => {
    setLoading(true)
    try {
      const s = await cashShiftsApi.getCurrent()
      setShift(s)
      if (s) {
        const t = await cashShiftsApi.getTotals()
        setTotals(t)
      } else {
        setTotals(null)
      }
    } catch {
      setShift(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTotals = useCallback(async () => {
    try {
      const t = await cashShiftsApi.getTotals()
      setTotals(t)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { void loadShift() }, [loadShift])

  const handleOpen = async () => {
    setOpening(true)
    setOpenErr(null)
    try {
      const s = await cashShiftsApi.open(openBal)
      setShift(s)
      const t = await cashShiftsApi.getTotals()
      setTotals(t)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setOpenErr(msg ?? 'Ошибка при открытии смены')
    } finally {
      setOpening(false)
    }
  }

  const handleClose = async (closingBalance: number, notes: string) => {
    await cashShiftsApi.close(closingBalance, notes)
    setCloseOpen(false)
    await loadShift()
  }

  const fmtDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('ru-KZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <PageHeader title="Касса" />
        <div style={{ marginTop: 32, fontSize: 13, color: 'var(--text-muted)' }}>Загрузка...</div>
      </div>
    )
  }

  // ── Closed state ─────────────────────────────────────────────────────────────
  if (!shift) {
    return (
      <div style={{ padding: 24 }}>
        <PageHeader title="Касса" />
        <div style={{
          marginTop: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 20, maxWidth: 400, margin: '40px auto 0',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DollarSign size={28} strokeWidth={1.5} color="var(--text-muted)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Смена закрыта</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Откройте кассовую смену, чтобы принимать оплату</div>
          </div>

          <div style={{ width: '100%', ...cardSt }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Начальный остаток (₸)
            </label>
            <input
              type="number"
              value={openBal}
              min={0}
              onChange={e => setOpenBal(Number(e.target.value))}
              style={{
                height: 44, width: '100%', boxSizing: 'border-box',
                padding: '0 14px', background: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 10,
                color: 'var(--text)', fontSize: 15, outline: 'none', marginBottom: 12,
              }}
            />
            {openErr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-danger)', marginBottom: 10 }}>
                <AlertCircle size={13} />{openErr}
              </div>
            )}
            <button
              onClick={() => void handleOpen()}
              disabled={opening}
              style={{
                width: '100%', height: 44,
                background: 'var(--accent)', border: 'none', borderRadius: 10,
                color: 'var(--accent-fg)', fontSize: 14, fontWeight: 600,
                cursor: opening ? 'not-allowed' : 'pointer', opacity: opening ? 0.7 : 1,
                transition: 'opacity 150ms ease-out',
              }}
            >
              {opening ? 'Открытие...' : 'Открыть смену'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Open state ───────────────────────────────────────────────────────────────
  const t = totals ?? { total: 0, total_cash: 0, total_card: 0, cash_in_drawer: 0 }

  return (
    <div style={{ padding: 24 }}>
      {closeOpen && totals && (
        <CloseShiftDialog
          totals={totals}
          onClose={() => setCloseOpen(false)}
          onConfirm={handleClose}
        />
      )}

      <PageHeader
        title="Касса"
        actions={
          <button
            onClick={() => setCloseOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 14px',
              background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 150ms ease-out',
            }}
          >
            <ChevronDown size={14} />
            Закрыть смену
          </button>
        }
      />

      {/* Shift info bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
          Смена открыта
        </span>
        <span>·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          {fmtDateTime(shift.opened_at)}
        </span>
        {shift.opened_by_name && (
          <>
            <span>·</span>
            <span>{shift.opened_by_name}</span>
          </>
        )}
        {shift.opening_balance > 0 && (
          <>
            <span>·</span>
            <span>Начальный остаток: {fmt(shift.opening_balance)} ₸</span>
          </>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard label="Итого выручка" value={t.total} icon={<DollarSign size={16} />} accent />
        <StatCard label="Наличные" value={t.total_cash} icon={<Banknote size={16} />} />
        <StatCard label="По карте" value={t.total_card} icon={<CreditCard size={16} />} />
        <StatCard label="В кассе" value={t.cash_in_drawer} icon={<Wallet size={16} />} />
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: 28 }} />

      {/* Embedded sale section */}
      <SalePage noHeader onSaleComplete={() => void loadTotals()} />
    </div>
  )
}
