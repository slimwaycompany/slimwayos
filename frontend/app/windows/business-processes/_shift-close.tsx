'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API, authHeaders } from '@/lib/auth';
import {
  KanbanBoard,
  KanbanCol,
  BpModal,
  IS,
  CARD_S,
  FieldRow,
} from './_kanban';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface BpShiftClose {
  id: string;
  status: string;
  shift_date?: string;
  cash_register?: number;
  cash_report?: number;
  cash_terminal?: number;
  cash_discrepancy?: boolean;
  cash_comment?: string;
  card_terminal?: number;
  card_report?: number;
  card_discrepancy?: boolean;
  card_comment?: string;
  created_at: string;
}

/* ── Columns ──────────────────────────────────────────────────────────────── */

const SHIFT_CLOSE_COLS: KanbanCol[] = [
  { id: 'not_done', name: 'Не отработанные',   color: 'var(--color-danger)' },
  { id: 'revision', name: 'Требуют доработки', color: 'var(--color-warning)' },
  { id: 'success',  name: 'Успешно',           color: 'var(--color-success)' },
];

/* ── Card ─────────────────────────────────────────────────────────────────── */

function ShiftCloseCard({ item }: { item: BpShiftClose }) {
  return (
    <div style={CARD_S}>
      {item.shift_date && (
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
          {item.shift_date}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
        {item.cash_register != null && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Нал: {item.cash_register.toLocaleString('ru-RU')} ₸
          </span>
        )}
        {item.card_terminal != null && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Безнал: {item.card_terminal.toLocaleString('ru-RU')} ₸
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {item.cash_discrepancy && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
              color: 'var(--color-danger)',
              borderRadius: 6,
              padding: '1px 6px',
            }}
          >
            Нал
          </span>
        )}
        {item.card_discrepancy && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
              color: 'var(--color-danger)',
              borderRadius: 6,
              padding: '1px 6px',
            }}
          >
            Безнал
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Create Modal ─────────────────────────────────────────────────────────── */

function CreateShiftCloseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [shiftDate, setShiftDate] = useState(today);
  const [cashRegister, setCashRegister] = useState('');
  const [cashReport, setCashReport] = useState('');
  const [cashTerminal, setCashTerminal] = useState('');
  const [cashDiscrepancy, setCashDiscrepancy] = useState(false);
  const [cashComment, setCashComment] = useState('');
  const [cardTerminal, setCardTerminal] = useState('');
  const [cardReport, setCardReport] = useState('');
  const [cardDiscrepancy, setCardDiscrepancy] = useState(false);
  const [cardComment, setCardComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/business-processes/shift-close`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_date: shiftDate,
          cash_register: cashRegister ? parseFloat(cashRegister) : undefined,
          cash_report: cashReport ? parseFloat(cashReport) : undefined,
          cash_terminal: cashTerminal ? parseFloat(cashTerminal) : undefined,
          cash_discrepancy: cashDiscrepancy,
          cash_comment: cashDiscrepancy ? cashComment : undefined,
          card_terminal: cardTerminal ? parseFloat(cardTerminal) : undefined,
          card_report: cardReport ? parseFloat(cardReport) : undefined,
          card_discrepancy: cardDiscrepancy,
          card_comment: cardDiscrepancy ? cardComment : undefined,
        }),
      });
      onCreated();
      onClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <BpModal title="Сдача смены" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FieldRow label="Дата">
          <input
            style={IS}
            type="date"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Нал в кассе (₸)">
          <input
            style={IS}
            type="number"
            value={cashRegister}
            onChange={(e) => setCashRegister(e.target.value)}
            placeholder="0"
          />
        </FieldRow>

        <FieldRow label="Нал по отчёту (₸)">
          <input
            style={IS}
            type="number"
            value={cashReport}
            onChange={(e) => setCashReport(e.target.value)}
            placeholder="0"
          />
        </FieldRow>

        <FieldRow label="Нал по терминалу (₸)">
          <input
            style={IS}
            type="number"
            value={cashTerminal}
            onChange={(e) => setCashTerminal(e.target.value)}
            placeholder="0"
          />
        </FieldRow>

        <FieldRow label="Расхождение по наличным?">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cashDiscrepancy}
              onChange={(e) => setCashDiscrepancy(e.target.checked)}
            />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>Да, есть расхождение</span>
          </label>
        </FieldRow>

        {cashDiscrepancy && (
          <FieldRow label="Комментарий по наличным">
            <textarea
              style={{ ...IS, minHeight: 55, resize: 'vertical' }}
              value={cashComment}
              onChange={(e) => setCashComment(e.target.value)}
              placeholder="Опишите расхождение"
            />
          </FieldRow>
        )}

        <FieldRow label="Безнал по терминалу (₸)">
          <input
            style={IS}
            type="number"
            value={cardTerminal}
            onChange={(e) => setCardTerminal(e.target.value)}
            placeholder="0"
          />
        </FieldRow>

        <FieldRow label="Безнал по отчёту (₸)">
          <input
            style={IS}
            type="number"
            value={cardReport}
            onChange={(e) => setCardReport(e.target.value)}
            placeholder="0"
          />
        </FieldRow>

        <FieldRow label="Расхождение по безналу?">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cardDiscrepancy}
              onChange={(e) => setCardDiscrepancy(e.target.checked)}
            />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>Да, есть расхождение</span>
          </label>
        </FieldRow>

        {cardDiscrepancy && (
          <FieldRow label="Комментарий по безналу">
            <textarea
              style={{ ...IS, minHeight: 55, resize: 'vertical' }}
              value={cardComment}
              onChange={(e) => setCardComment(e.target.value)}
              placeholder="Опишите расхождение"
            />
          </FieldRow>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            marginTop: 4,
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            border: 'none',
            borderRadius: 10,
            padding: '9px 0',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          Создать
        </button>
      </div>
    </BpModal>
  );
}

/* ── ShiftCloseBoard ──────────────────────────────────────────────────────── */

export default function ShiftCloseBoard() {
  const [items, setItems] = useState<BpShiftClose[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [createModal, setCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/business-processes/shift-close`, {
        headers: authHeaders(),
      });
      if (!res.ok) { setApiError(true); setItems([]); return; }
      const data: unknown = await res.json();
      setItems(Array.isArray(data) ? (data as BpShiftClose[]) : []);
      setApiError(false);
    } catch {
      setApiError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (item: BpShiftClose, newStatus: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)),
    );
    try {
      await fetch(`${API}/business-processes/shift-close/${item.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)),
      );
    }
  };

  const toolbar = (
    <>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
        Сдача смены
      </span>
      <button
        onClick={() => setCreateModal(true)}
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-fg)',
          border: 'none',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Создать
      </button>
    </>
  );

  return (
    <>
      <KanbanBoard<BpShiftClose>
        columns={SHIFT_CLOSE_COLS}
        items={items}
        loading={loading}
        apiError={apiError}
        renderCard={(item) => <ShiftCloseCard item={item} />}
        onStatusChange={handleStatusChange}
        onAddClick={() => setCreateModal(true)}
        toolbar={toolbar}
      />
      {createModal && (
        <CreateShiftCloseModal onClose={() => setCreateModal(false)} onCreated={load} />
      )}
    </>
  );
}
