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

interface SupplyItem {
  name: string;
  qty: number;
}

interface BpSupplies {
  id: string;
  status: string;
  from_employee_name?: string;
  needed_date?: string;
  items?: SupplyItem[];
  created_at: string;
}

/* ── Columns ──────────────────────────────────────────────────────────────── */

const SUPPLIES_COLS: KanbanCol[] = [
  { id: 'new',         name: 'Новые',      color: 'var(--color-info)' },
  { id: 'in_progress', name: 'В работе',   color: 'var(--color-warning)' },
  { id: 'success',     name: 'Успешно',    color: 'var(--color-success)' },
  { id: 'rejected',    name: 'Отклонено',  color: 'var(--color-danger)' },
];

/* ── Card ─────────────────────────────────────────────────────────────────── */

function SuppliesCard({ item }: { item: BpSupplies }) {
  const count = Array.isArray(item.items) ? item.items.length : 0;
  return (
    <div style={CARD_S}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
        {item.from_employee_name ?? '—'}
      </div>
      {item.needed_date && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          {item.needed_date}
        </div>
      )}
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {count} {count === 1 ? 'позиция' : count < 5 ? 'позиции' : 'позиций'}
      </div>
    </div>
  );
}

/* ── Create Modal ─────────────────────────────────────────────────────────── */

function CreateSuppliesModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const employees = useEmployees();
  const [employeeId, setEmployeeId] = useState('');
  const [neededDate, setNeededDate] = useState('');
  const [items, setItems] = useState<SupplyItem[]>([{ name: '', qty: 1 }]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems((prev) => [...prev, { name: '', qty: 1 }]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof SupplyItem, value: string | number) =>
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );

  const handleSubmit = async () => {
    const selectedEmp = employees.find((e) => e.id === employeeId);
    setSaving(true);
    try {
      await fetch(`${API}/business-processes/supplies`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_employee_name: selectedEmp?.full_name ?? '',
          needed_date: neededDate || undefined,
          items: items.filter((i) => i.name.trim()),
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
    <BpModal title="Новая заявка на расходники" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FieldRow label="От кого *">
          <select
            style={IS}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">— выбрать —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="На какой день *">
          <input
            style={IS}
            type="date"
            value={neededDate}
            onChange={(e) => setNeededDate(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Что и в каком количестве">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  style={{ ...IS, flex: 2 }}
                  placeholder="Наименование"
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                />
                <input
                  style={{ ...IS, flex: 1, width: 70 }}
                  type="number"
                  min={1}
                  placeholder="Кол-во"
                  value={item.qty}
                  onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value) || 1)}
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(idx)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: 'var(--color-danger)',
                      fontSize: 12,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addItem}
              style={{
                background: 'none',
                border: '1px dashed var(--border)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              + Добавить позицию
            </button>
          </div>
        </FieldRow>

        <button
          onClick={handleSubmit}
          disabled={saving || !employeeId || !neededDate}
          style={{
            marginTop: 4,
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            border: 'none',
            borderRadius: 10,
            padding: '9px 0',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving || !employeeId || !neededDate ? 'not-allowed' : 'pointer',
            opacity: saving || !employeeId || !neededDate ? 0.6 : 1,
          }}
        >
          Создать
        </button>
      </div>
    </BpModal>
  );
}

/* ── SuppliesBoard ────────────────────────────────────────────────────────── */

export default function SuppliesBoard() {
  const [items, setItems] = useState<BpSupplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [createModal, setCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/business-processes/supplies`, {
        headers: authHeaders(),
      });
      if (!res.ok) { setApiError(true); setItems([]); return; }
      const data: unknown = await res.json();
      setItems(Array.isArray(data) ? (data as BpSupplies[]) : []);
      setApiError(false);
    } catch {
      setApiError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (item: BpSupplies, newStatus: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)),
    );
    try {
      await fetch(`${API}/business-processes/supplies/${item.id}`, {
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
        Заявка на расходники
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
        + Новая заявка
      </button>
    </>
  );

  return (
    <>
      <KanbanBoard<BpSupplies>
        columns={SUPPLIES_COLS}
        items={items}
        loading={loading}
        apiError={apiError}
        renderCard={(item) => <SuppliesCard item={item} />}
        onStatusChange={handleStatusChange}
        onAddClick={() => setCreateModal(true)}
        toolbar={toolbar}
      />
      {createModal && (
        <CreateSuppliesModal onClose={() => setCreateModal(false)} onCreated={load} />
      )}
    </>
  );
}
