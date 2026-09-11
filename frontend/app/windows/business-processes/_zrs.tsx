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

interface BpZrs {
  id: string;
  status: string;
  from_employee_name?: string;
  goal?: string;
  amount?: number;
  description?: string;
  finance_date?: string;
  created_at: string;
}

/* ── Columns ──────────────────────────────────────────────────────────────── */

const ZRS_COLS: KanbanCol[] = [
  { id: 'new',            name: 'Новые',                color: 'var(--color-info)' },
  { id: 'approved',       name: 'Одобрено',             color: 'var(--color-success)' },
  { id: 'revision',       name: 'Требует доработки',    color: 'var(--color-warning)' },
  { id: 'awaiting_close', name: 'Ждет закрывашки',      color: '#8b5cf6' },
  { id: 'closed',         name: 'Закрыто',              color: 'var(--text-muted)' },
  { id: 'rejected',       name: 'Отклонено',            color: 'var(--color-danger)' },
];

/* ── Card ─────────────────────────────────────────────────────────────────── */

function ZrsCard({ item }: { item: BpZrs }) {
  const goalText =
    item.goal && item.goal.length > 40 ? item.goal.slice(0, 40) + '...' : item.goal ?? '—';

  return (
    <div style={CARD_S}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
        {item.from_employee_name ?? '—'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
        {goalText}
      </div>
      {item.amount != null && (
        <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
          {item.amount.toLocaleString('ru-RU')} ₸
        </div>
      )}
      {item.finance_date && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Фин. план: {item.finance_date}
        </div>
      )}
    </div>
  );
}

/* ── Create Modal ─────────────────────────────────────────────────────────── */

function CreateZrsModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const employees = useEmployees();
  const [employeeId, setEmployeeId] = useState('');
  const [goal, setGoal] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [financeDate, setFinanceDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const selectedEmp = employees.find((e) => e.id === employeeId);
    setSaving(true);
    try {
      await fetch(`${API}/business-processes/zrs`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_employee_name: selectedEmp?.full_name ?? '',
          goal,
          amount: amount ? parseFloat(amount) : undefined,
          description,
          finance_date: financeDate || undefined,
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
    <BpModal title="Новый ЗРС" onClose={onClose}>
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

        <FieldRow label="Цель *">
          <input
            style={IS}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Цель ЗРС"
          />
        </FieldRow>

        <FieldRow label="Сумма (₸)">
          <input
            style={IS}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </FieldRow>

        <FieldRow label="Описание">
          <textarea
            style={{ ...IS, minHeight: 70, resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Необязательно"
          />
        </FieldRow>

        <FieldRow label="Дата ближайшего финансового планирования">
          <input
            style={IS}
            type="date"
            value={financeDate}
            onChange={(e) => setFinanceDate(e.target.value)}
          />
        </FieldRow>

        <button
          onClick={handleSubmit}
          disabled={saving || !employeeId || !goal}
          style={{
            marginTop: 4,
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            border: 'none',
            borderRadius: 10,
            padding: '9px 0',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving || !employeeId || !goal ? 'not-allowed' : 'pointer',
            opacity: saving || !employeeId || !goal ? 0.6 : 1,
          }}
        >
          Создать
        </button>
      </div>
    </BpModal>
  );
}

/* ── ZrsBoard ─────────────────────────────────────────────────────────────── */

export default function ZrsBoard() {
  const [items, setItems] = useState<BpZrs[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [createModal, setCreateModal] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [pendingDateFrom, setPendingDateFrom] = useState('');
  const [pendingDateTo, setPendingDateTo] = useState('');
  const [pendingEmployee, setPendingEmployee] = useState('');

  const load = useCallback(async (df?: string, dt?: string, emp?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (df) params.set('dateFrom', df);
      if (dt) params.set('dateTo', dt);
      if (emp) params.set('employee', emp);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API}/business-processes/zrs${qs}`, {
        headers: authHeaders(),
      });
      if (!res.ok) { setApiError(true); setItems([]); return; }
      const data: unknown = await res.json();
      setItems(Array.isArray(data) ? (data as BpZrs[]) : []);
      setApiError(false);
    } catch {
      setApiError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleApply = () => {
    setDateFrom(pendingDateFrom);
    setDateTo(pendingDateTo);
    setEmployeeSearch(pendingEmployee);
    void load(pendingDateFrom, pendingDateTo, pendingEmployee);
  };

  const handleStatusChange = async (item: BpZrs, newStatus: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)),
    );
    try {
      await fetch(`${API}/business-processes/zrs/${item.id}`, {
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
      <input
        style={{ ...IS, width: 130 }}
        type="date"
        value={pendingDateFrom}
        onChange={(e) => setPendingDateFrom(e.target.value)}
        title="С даты"
      />
      <input
        style={{ ...IS, width: 130 }}
        type="date"
        value={pendingDateTo}
        onChange={(e) => setPendingDateTo(e.target.value)}
        title="По дату"
      />
      <input
        style={{ ...IS, width: 150 }}
        placeholder="Имя сотрудника"
        value={pendingEmployee}
        onChange={(e) => setPendingEmployee(e.target.value)}
      />
      <button
        onClick={handleApply}
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
        Применить
      </button>
      <div style={{ flex: 1 }} />
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
        + Новый ЗРС
      </button>
    </>
  );

  return (
    <>
      <KanbanBoard<BpZrs>
        columns={ZRS_COLS}
        items={items}
        loading={loading}
        apiError={apiError}
        renderCard={(item) => <ZrsCard item={item} />}
        onStatusChange={handleStatusChange}
        onAddClick={() => setCreateModal(true)}
        toolbar={toolbar}
      />
      {createModal && (
        <CreateZrsModal
          onClose={() => setCreateModal(false)}
          onCreated={() => void load(dateFrom, dateTo, employeeSearch)}
        />
      )}
    </>
  );
}
