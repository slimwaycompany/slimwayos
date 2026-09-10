'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { API, authHeaders } from '@/lib/auth';

/* ─── Constants ───────────────────────────────────────────────────────────── */

const DEVICES = [
  { id: 'vacuactiv',  label: 'VacuActiv',  color: 'var(--accent)' },
  { id: 'infrashape', label: 'InfraShape', color: 'var(--color-warning)' },
  { id: 'infrastep',  label: 'InfraStep',  color: '#8b5cf6' },
  { id: 'rollshape',  label: 'RollShape',  color: '#263CD9' },
];

const HOUR_START = 7;
const HOUR_END   = 21;
const SLOT_W     = 80;
const ROW_H      = 56;
const LABEL_W    = 130;

const HOURS: number[] = [];
for (let h = HOUR_START; h <= HOUR_END; h++) HOURS.push(h);

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Slot {
  id: string;
  device_type: string;
  time_start: string;
  time_end: string;
  status: 'free' | 'booked' | 'blocked';
  client_name?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
}

function timeToFraction(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h + m / 60 - HOUR_START) / (HOUR_END - HOUR_START);
}

function slotStyle(status: Slot['status']): React.CSSProperties {
  if (status === 'booked')  return { background: 'color-mix(in srgb, var(--accent) 18%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)', color: 'var(--accent)' };
  if (status === 'blocked') return { background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)', color: 'var(--color-warning)' };
  return { background: 'color-mix(in srgb, var(--color-success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)', color: 'var(--color-success)' };
}

/* ─── Current time marker ────────────────────────────────────────────────── */

function currentLeft(totalW: number): number | null {
  const now  = new Date();
  const frac = (now.getHours() + now.getMinutes() / 60 - HOUR_START) / (HOUR_END - HOUR_START);
  if (frac < 0 || frac > 1) return null;
  return frac * totalW;
}

/* ─── Day slots grid ─────────────────────────────────────────────────────── */

function SlotsGrid({ slots, deviceId }: { slots: Slot[]; deviceId: string }) {
  const totalW = SLOT_W * (HOUR_END - HOUR_START);
  const devSlots = slots.filter((s) => s.device_type === deviceId);

  return (
    <div style={{ position: 'relative', height: ROW_H, width: totalW, flexShrink: 0 }}>
      {devSlots.map((slot) => {
        const left  = timeToFraction(slot.time_start) * totalW;
        const right = timeToFraction(slot.time_end)   * totalW;
        const width = right - left;
        const st    = slotStyle(slot.status);
        return (
          <div
            key={slot.id}
            title={`${slot.time_start}–${slot.time_end}${slot.client_name ? ' · ' + slot.client_name : ''}`}
            style={{
              position: 'absolute',
              top: 6, bottom: 6,
              left,
              width: Math.max(width - 2, 4),
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: 'default',
              userSelect: 'none',
              ...st,
            }}
          >
            {width > 50 && (slot.client_name ?? (slot.status === 'free' ? 'Своб.' : slot.status === 'blocked' ? 'Блок.' : ''))}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function SchedulePage() {
  const [date,    setDate]    = useState(() => new Date());
  const [slots,   setSlots]   = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalW = SLOT_W * (HOUR_END - HOUR_START);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const iso = toISO(date);
      const res = await fetch(`${API}/schedule-slots?date=${iso}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json() as Slot[];
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setApiError(true);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  // Scroll to current time on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const now  = new Date();
    const frac = (now.getHours() - HOUR_START) / (HOUR_END - HOUR_START);
    const left = frac * totalW - scrollRef.current.clientWidth / 2;
    scrollRef.current.scrollLeft = Math.max(0, left);
  }, [totalW]);

  const prevDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  const goToday = () => setDate(new Date());

  const isToday = toISO(date) === toISO(new Date());
  const nowLeft = isToday ? currentLeft(totalW) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', padding: '10px 0', flexWrap: 'wrap' }}>
        <button
          onClick={prevDay}
          style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
            {formatDate(date)}
          </span>
        </div>

        <button
          onClick={nextDay}
          style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={16} />
        </button>

        {!isToday && (
          <button
            onClick={goToday}
            style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Сегодня
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Свободно', color: 'var(--color-success)' },
            { label: 'Занято',   color: 'var(--accent)' },
            { label: 'Блок.',    color: 'var(--color-warning)' },
          ].map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: `color-mix(in srgb, ${l.color} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${l.color} 45%, transparent)` }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Загрузка...
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflowY: 'auto', minHeight: 0, marginTop: 12 }}>
          {/* Device labels */}
          <div style={{ flexShrink: 0, width: LABEL_W }}>
            {/* Header spacer */}
            <div style={{ height: 32 }} />
            {DEVICES.map((dev) => (
              <div
                key={dev.id}
                style={{
                  height: ROW_H,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  borderBottom: '1px solid var(--border)',
                  gap: 8,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dev.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{dev.label}</span>
              </div>
            ))}
          </div>

          {/* Timeline scroll area */}
          <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', position: 'relative' }}>
            {/* Hour headers */}
            <div style={{ display: 'flex', height: 32, position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    width: SLOT_W,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingLeft: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    borderRight: '1px solid var(--border)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Device rows */}
            <div style={{ position: 'relative' }}>
              {/* Hour grid lines */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                {HOURS.map((h) => (
                  <div key={h} style={{ width: SLOT_W, flexShrink: 0, borderRight: '1px solid var(--border)', opacity: 0.4 }} />
                ))}
              </div>

              {/* Current time indicator */}
              {nowLeft !== null && (
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: nowLeft, width: 2, background: 'var(--color-danger)', zIndex: 3, pointerEvents: 'none' }} />
              )}

              {DEVICES.map((dev) => (
                <div
                  key={dev.id}
                  style={{
                    display: 'flex',
                    height: ROW_H,
                    borderBottom: '1px solid var(--border)',
                    position: 'relative',
                  }}
                >
                  {apiError ? (
                    /* placeholder hours */
                    HOURS.map((h) => (
                      <div
                        key={h}
                        style={{ width: SLOT_W, flexShrink: 0, height: '100%' }}
                      />
                    ))
                  ) : (
                    <SlotsGrid slots={slots} deviceId={dev.id} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API error notice */}
      {apiError && !loading && (
        <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          API расписания не подключён — отображается пустая сетка. Эндпоинт /schedule-slots будет добавлен позже.
        </div>
      )}
    </div>
  );
}
