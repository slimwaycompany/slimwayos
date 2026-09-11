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
  useEmployees,
} from './_kanban';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface BpShiftOpen {
  id: string;
  status: string;
  shift_date?: string;
  cash_register?: number;
  cash_report?: number;
  has_discrepancy?: boolean;
  discrepancy_comment?: string;
  given_by_name?: string;
  received_by_name?: string;
  created_at: string;
}

/* ── Columns ──────────────────────────────────────────────────────────────── */

const SHIFT_OPEN_COLS: KanbanCol[] = [
  { id: 'not_done', name: 'Не отработанные',   color: 'var(--color-danger)' },
  { id: 'revision', name: 'Требуют доработки', color: 'var(--color-warning)' },
  { id: 'success',  name: 'Успешно',           color: 'var(--color-success)' },
];

/* ── Card ─────────────────────────────────────────────────────────────────── */

function ShiftOpenCard({ item }: { item: BpShiftOpen }) {
  return (
    <div style={CARD_S}>
      {item.shift_date && (
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
          {item.shift_date}
        </div>
      )}
      {item.given_by_name && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Сдал: {item.given_by_name}
        </div>
      )}
      {item.received_by_name && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Принял: {item.received_by_name}
        </div>
      )}
      {item.has_discrepancy && (
        <span
          style={{
            display: 'inline-block',
            marginTop: 5,
            fontSize: 10,
            fontWeight: 600,
            background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
            color: 'var(--color-danger)',
            borderRadius: 6,
            padding: '1px 6px',
          }}
        >
          Расхождение
        </span>
      )}
    </div>
  );
}

/* ── Create Modal ─────────────────────────────────────────────────────────── */

function CreateShiftOpenModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const employees = useEmployees();
  const today = new Date().toISOString().slice(0, 10);
  const [shiftDate, setShiftDate] = useState(today);
  const [cashRegister, setCashRegister] = useState('');
  const [cashReport, setCashReport] = useState('');
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [discrepancyComment, setDiscrepancyComment] = useState('');
  const [givenById, setGivenById] = useState('');
  const [receivedById, setReceivedById] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const givenEmp = employees.find((e) => e.id === givenById);
    const receivedEmp = employees.find((e) => e.id === receivedById);
    setSaving(true);
    try {
      await fetch(`${API}/business-processes/shift-open`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_date: shiftDate,
          cash_register: cashRegister ? parseFloat(cashRegister) : undefined,
          cash_report: cashReport ? parseFloat(cashReport) : undefined,
          has_discrepancy: hasDiscrepancy,
          discrepancy_comment: hasDiscrepancy ? discrepancyComment : undefined,
          given_by_name: givenEmp?.full_name ?? '',
          received_by_name: receivedEmp?.full_name ?? '',
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
    <BpModal title="Открытие смены" onClose={onClose}>
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

        <FieldRow label="Есть расхождение?">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hasDiscrepancy}
              onChange={(e) => setHasDiscrepancy(e.target.checked)}
            />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>Да, есть расхождение</span>
          </label>
        </FieldRow>

        {hasDiscrepancy && (
          <FieldRow label="Комментарий к расхождению">
            <textarea
              style={{ ...IS, minHeight: 60, resize: 'vertical' }}
              value={discrepancyComment}
              onChange={(e) => setDiscrepancyComment(e.target.value)}
              placeholder="Опишите расхождение"
            />
          </FieldRow>
        )}

        <FieldRow label="Кто сдал">
          <select
            style={IS}
            value={givenById}
            onChange={(e) => setGivenById(e.target.value)}
          >
            <option value="">— выбрать —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Кто принял">
          <select
            style={IS}
            value={receivedById}
            onChange={(e) => setReceivedById(e.target.value)}
          >
            <option value="">— выбрать —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>
        </FieldRow>

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

/* ── ShiftOpenBoard ───────────────────────────────────────────────────────── */

export default function ShiftOpenBoard() {
  const [items, setItems] = useState<BpShiftOpen[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [createModal, setCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/business-processes/shift-open`, {
        headers: authHeaders(),
      });
      if (!res.ok) { setApiError(true); setItems([]); return; }
      const data: unknown = await res.json();
      setItems(Array.isArray(data) ? (data as BpShiftOpen[]) : []);
      setApiError(false);
    } catch {
      setApiError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (item: BpShiftOpen, newStatus: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)),
    );
    try {
      await fetch(`${API}/business-processes/shift-open/${item.id}`, {
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
        Открытие смены
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
      <KanbanBoard<BpShiftOpen>
        columns={SHIFT_OPEN_COLS}
        items={items}
        loading={loading}
        apiError={apiError}
        renderCard={(item) => <ShiftOpenCard item={item} />}
        onStatusChange={handleStatusChange}
        onAddClick={() => setCreateModal(true)}
        toolbar={toolbar}
      />
      {createModal && (
        <CreateShiftOpenModal onClose={() => setCreateModal(false)} onCreated={load} />
      )}
    </>
  );
}
