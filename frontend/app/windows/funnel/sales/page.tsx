'use client';

import { useState, useEffect } from 'react';
import { API, authHeaders } from '@/lib/auth';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ShiftState {
  isOpen: boolean;
  openedAt: string | null;
  cashBalance: number;
}

interface DaySales {
  cash: number;
  card: number;
  loading: boolean;
}

/* ─── Storage helpers ────────────────────────────────────────────────────── */

const SHIFT_KEY = 'slimway_kassa_shift';

function loadShift(): ShiftState {
  if (typeof window === 'undefined') return { isOpen: false, openedAt: null, cashBalance: 0 };
  try {
    const raw = localStorage.getItem(SHIFT_KEY);
    if (!raw) return { isOpen: false, openedAt: null, cashBalance: 0 };
    return JSON.parse(raw) as ShiftState;
  } catch {
    return { isOpen: false, openedAt: null, cashBalance: 0 };
  }
}

function saveShift(s: ShiftState) {
  localStorage.setItem(SHIFT_KEY, JSON.stringify(s));
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub, accent }: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${accent ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)'}`,
      borderRadius: 14,
      padding: '20px 24px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function KassaPage() {
  const [shift, setShift]   = useState<ShiftState>({ isOpen: false, openedAt: null, cashBalance: 0 });
  const [sales, setSales]   = useState<DaySales>({ cash: 0, card: 0, loading: true });
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setShift(loadShift());
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`${API}/kassa/summary?date=${today}`, { headers: authHeaders() });
        if (!res.ok) throw new Error();
        const data = await res.json() as { cash: number; card: number };
        setSales({ cash: data.cash ?? 0, card: data.card ?? 0, loading: false });
      } catch {
        setSales({ cash: 0, card: 0, loading: false });
      }
    };
    void load();
  }, []);

  const handleToggleShift = async () => {
    setToggling(true);
    try {
      if (shift.isOpen) {
        const next: ShiftState = { isOpen: false, openedAt: null, cashBalance: shift.cashBalance };
        setShift(next);
        saveShift(next);
        await fetch(`${API}/kassa/shift/close`, { method: 'POST', headers: authHeaders() }).catch(() => null);
      } else {
        const next: ShiftState = { isOpen: true, openedAt: new Date().toISOString(), cashBalance: shift.cashBalance };
        setShift(next);
        saveShift(next);
        await fetch(`${API}/kassa/shift/open`, { method: 'POST', headers: authHeaders() }).catch(() => null);
      }
    } finally {
      setToggling(false);
    }
  };

  const fmtMoney = (n: number) => n.toLocaleString('ru-RU') + ' ₸';

  const shiftDuration = (): string => {
    if (!shift.openedAt) return '';
    const ms = Date.now() - new Date(shift.openedAt).getTime();
    const h  = Math.floor(ms / 3600000);
    const m  = Math.floor((ms % 3600000) / 60000);
    return `${h} ч ${m} мин`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Shift toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 24px',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            Смена{' '}
            <span style={{
              display: 'inline-block',
              marginLeft: 8,
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: shift.isOpen
                ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
                : 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
              color: shift.isOpen ? 'var(--color-success)' : 'var(--text-muted)',
              border: `1px solid ${shift.isOpen ? 'color-mix(in srgb, var(--color-success) 30%, transparent)' : 'var(--border)'}`,
            }}>
              {shift.isOpen ? 'Открыта' : 'Закрыта'}
            </span>
          </div>
          {shift.isOpen && shift.openedAt && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Открыта в {new Date(shift.openedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · {shiftDuration()}
            </div>
          )}
        </div>
        <button
          onClick={() => void handleToggleShift()}
          disabled={toggling}
          style={{
            height: 38,
            padding: '0 20px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: toggling ? 'not-allowed' : 'pointer',
            opacity: toggling ? 0.6 : 1,
            transition: 'opacity 150ms ease-out',
            background: shift.isOpen
              ? 'color-mix(in srgb, var(--color-danger) 12%, transparent)'
              : 'var(--accent)',
            color: shift.isOpen ? 'var(--color-danger)' : 'var(--accent-fg)',
            outline: shift.isOpen ? '1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)' : 'none',
          }}
        >
          {toggling ? '...' : shift.isOpen ? 'Закрыть смену' : 'Открыть смену'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard
          label="Наличных в кассе"
          value={fmtMoney(shift.cashBalance)}
          sub="Текущий остаток"
          accent
        />
        <StatCard
          label="Нал за день"
          value={sales.loading ? '...' : fmtMoney(sales.cash)}
          sub="Наличные продажи сегодня"
        />
        <StatCard
          label="Безнал за день"
          value={sales.loading ? '...' : fmtMoney(sales.card)}
          sub="Безналичные продажи сегодня"
        />
      </div>

      {/* Cash balance input */}
      {shift.isOpen && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10 }}>Обновить остаток наличных в кассе</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              min={0}
              value={shift.cashBalance}
              onChange={(e) => {
                const next = { ...shift, cashBalance: Number(e.target.value) || 0 };
                setShift(next);
                saveShift(next);
              }}
              style={{
                width: 200,
                height: 38,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 14,
                padding: '0 12px',
                outline: 'none',
                fontVariantNumeric: 'tabular-nums',
              }}
              placeholder="0"
            />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>₸</span>
          </div>
        </div>
      )}

      {!shift.isOpen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 0',
          color: 'var(--text-muted)',
          fontSize: 13,
          borderRadius: 14,
          border: '1px dashed var(--border)',
        }}>
          Откройте смену, чтобы работать с кассой
        </div>
      )}
    </div>
  );
}
