'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { API, authHeaders } from '@/lib/auth';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Shift {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  profiles?: { first_name: string; last_name: string };
}

type AttendanceStatus = 'active' | 'done';

interface AttendanceCard {
  shift: Shift;
  status: AttendanceStatus;
}

/* ─── Attendance Board ───────────────────────────────────────────────────── */

function AttendanceBoard({ onClose }: { onClose: () => void }) {
  const [cards, setCards]   = useState<AttendanceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const draggingRef           = useRef<AttendanceCard | null>(null);
  const [dragOver, setDragOver] = useState<AttendanceStatus | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/shifts`, { headers: authHeaders() });
      const data: Shift[] = await res.json();
      const todayShifts = Array.isArray(data) ? data.filter((s) => s.date === today) : [];
      setCards(todayShifts.map((s) => ({ shift: s, status: 'active' as AttendanceStatus })));
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { void load(); }, [load]);

  const moveTo = (id: string, status: AttendanceStatus) => {
    setCards((prev) => prev.map((c) => c.shift.id === id ? { ...c, status } : c));
  };

  const handleDrop = (status: AttendanceStatus) => {
    if (draggingRef.current && draggingRef.current.status !== status) {
      moveTo(draggingRef.current.shift.id, status);
    }
    draggingRef.current = null;
    setDragOver(null);
  };

  const nameOf = (s: Shift) =>
    s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name}` : s.employee_id;

  const timeOf = (s: Shift) => `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`;

  const renderCard = (card: AttendanceCard) => (
    <div
      key={card.shift.id}
      draggable
      onDragStart={() => { draggingRef.current = card; }}
      onDragEnd={() => { draggingRef.current = null; }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderLeft: `3px solid ${card.status === 'active' ? '#10b981' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 10,
        padding: '10px 12px',
        cursor: 'grab',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-body font-semibold text-gray-100">{nameOf(card.shift)}</span>
        {card.status === 'active' && (
          <button
            onClick={() => moveTo(card.shift.id, 'done')}
            className="flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-caption font-medium text-green-400 transition-colors hover:bg-green-500/20"
          >
            <Check className="h-3 w-3" />
            Готово
          </button>
        )}
      </div>
      <div className="mt-1 text-caption text-gray-500">{timeOf(card.shift)}</div>
      {card.shift.notes && (
        <div className="mt-1 text-caption text-gray-600 line-clamp-1">{card.shift.notes}</div>
      )}
    </div>
  );

  const column = (status: AttendanceStatus, label: string, color: string) => {
    const col = cards.filter((c) => c.status === status);
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={() => handleDrop(status)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.02)',
          border: `2px solid ${dragOver === status ? color : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 14,
          overflow: 'hidden',
          transition: 'border-color 150ms ease-out',
          minHeight: 300,
        }}
      >
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
          <span style={{
            background: `${color}22`,
            color,
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
          }}>{col.length}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {col.length === 0 && (
            <div className="py-6 text-center text-caption text-gray-600">Пусто</div>
          )}
          {col.map(renderCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="glass flex h-[85vh] w-full max-w-3xl flex-col rounded-2xl shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <h3 className="text-body font-bold text-white">Отметка на смене</h3>
            <p className="mt-0.5 text-caption text-gray-500">
              {today} · {cards.length} смен
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-caption text-gray-500">
            Загрузка смен...
          </div>
        ) : (
          <div className="flex flex-1 gap-4 overflow-hidden p-5">
            {column('active', '🟢 На смене', '#10b981')}
            {column('done',   '✅ Отработано', 'rgba(255,255,255,0.4)')}
          </div>
        )}

        {cards.length === 0 && !loading && (
          <div className="px-6 pb-5 text-center text-caption text-gray-600">
            Нет смен на сегодня. Добавьте смены в разделе HR.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Process grid ───────────────────────────────────────────────────────── */

interface Process {
  id: string;
  title: string;
  description: string;
  content?: string;
  disabled?: boolean;
  action?: () => void;
}

export default function BusinessProcessesPage() {
  const [active, setActive]       = useState<Process | null>(null);
  const [showAttend, setShowAttend] = useState(false);

  const processes: Process[] = [
    {
      id: 'srz',
      title: 'СРЗ',
      description: 'Стандарты работы заведения',
      content: 'Общие стандарты работы заведения — документы и регламенты появятся здесь.',
    },
    {
      id: 'shift-mark',
      title: 'Отметка на смене',
      description: 'Фиксация начала и конца смены',
      action: () => setShowAttend(true),
    },
    {
      id: 'shift-close',
      title: 'Чек сдача смены',
      description: 'Закрытие и сдача смены',
      content: 'Чеклист и процедура закрытия смены. Функционал в разработке.',
    },
    {
      id: 'shift-accept',
      title: 'Прием смены',
      description: 'Приёмка смены от предыдущего сотрудника',
      content: 'Форма и процедура приёма смены. Функционал в разработке.',
    },
    {
      id: 'supplies',
      title: 'Заявка на расходники',
      description: 'Запрос расходных материалов',
      content: 'Форма заявки на расходники и просмотр статуса. Функционал в разработке.',
    },
    { id: 'onboarding', title: 'Онбординг',           description: 'Введение нового сотрудника',   disabled: true },
    { id: 'quality',    title: 'Контроль качества',    description: 'Проверки и стандарты',         disabled: true },
    { id: 'inventory',  title: 'Инвентаризация',       description: 'Учёт товаров и расходников',   disabled: true },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {processes.map((p) => (
          <button
            key={p.id}
            disabled={p.disabled}
            onClick={() => {
              if (p.disabled) return;
              if (p.action) { p.action(); }
              else setActive(p);
            }}
            className={clsx(
              'flex flex-col gap-2 rounded-2xl p-6 text-left transition-all duration-200',
              p.disabled ? 'cursor-not-allowed glass opacity-40' : 'glass-hover cursor-pointer',
            )}
          >
            <span className="text-body font-semibold text-gray-100">{p.title}</span>
            <span className="text-caption text-gray-500">{p.description}</span>
            {p.disabled && (
              <span className="mt-1 w-fit rounded-full bg-white/5 px-2 py-0.5 text-caption text-gray-500">
                скоро
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Info modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="glass flex h-[500px] w-[640px] flex-col p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex shrink-0 items-center justify-between">
              <h2 className="text-subheading text-white">{active.title}</h2>
              <button
                onClick={() => setActive(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <p className="text-body text-gray-400">{active.description}</p>
              {active.content && (
                <p className="mt-4 text-body text-gray-500">{active.content}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance board */}
      {showAttend && <AttendanceBoard onClose={() => setShowAttend(false)} />}
    </>
  );
}
