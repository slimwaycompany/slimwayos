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

interface BpAttendance {
  id: string;
  status: string;
  branch?: string;
  employee_name?: string;
  recorded_at?: string;
  is_replacement?: boolean;
  replaces_name?: string;
  comment?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

/* ── Columns ──────────────────────────────────────────────────────────────── */

const ATTENDANCE_COLS: KanbanCol[] = [
  { id: 'mark',    name: 'Отметка',  color: 'var(--color-info)' },
  { id: 'control', name: 'Контроль', color: 'var(--color-warning)' },
  { id: 'success', name: 'Успешно',  color: 'var(--color-success)' },
];

/* ── Card ─────────────────────────────────────────────────────────────────── */

function AttendanceCard({ item }: { item: BpAttendance }) {
  const timeStr = item.recorded_at
    ? new Date(item.recorded_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={CARD_S}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
        {item.employee_name ?? '—'}
      </div>
      {item.branch && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          {item.branch}
        </div>
      )}
      {timeStr && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeStr}</div>
      )}
      {item.is_replacement && (
        <span
          style={{
            display: 'inline-block',
            marginTop: 4,
            fontSize: 10,
            fontWeight: 600,
            background: 'color-mix(in srgb, var(--color-info) 15%, transparent)',
            color: 'var(--color-info)',
            borderRadius: 6,
            padding: '1px 6px',
          }}
        >
          Замена
        </span>
      )}
      {item.latitude != null && item.longitude != null && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </div>
      )}
    </div>
  );
}

/* ── Create Modal ─────────────────────────────────────────────────────────── */

function CreateAttendanceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const employees = useEmployees();
  const [branch, setBranch] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isReplacement, setIsReplacement] = useState(false);
  const [replacesId, setReplacesId] = useState('');
  const [comment, setComment] = useState('');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const currentTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleGeo = () => {
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setGeoStatus('ok');
      },
      () => setGeoStatus('error'),
    );
  };

  const handleSubmit = async () => {
    const selectedEmp = employees.find((e) => e.id === employeeId);
    const replacesEmp = employees.find((e) => e.id === replacesId);
    setSaving(true);
    try {
      await fetch(`${API}/business-processes/attendance`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch,
          employee_name: selectedEmp?.full_name ?? '',
          recorded_at: new Date().toISOString(),
          is_replacement: isReplacement,
          replaces_name: isReplacement ? (replacesEmp?.full_name ?? '') : undefined,
          comment,
          latitude: lat ?? undefined,
          longitude: lon ?? undefined,
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
    <BpModal title="Новая отметка на смене" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FieldRow label="Филиал">
          <input
            style={IS}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Название филиала"
          />
        </FieldRow>

        <FieldRow label="Сотрудник *">
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

        <FieldRow label="Время отметки">
          <input style={{ ...IS, opacity: 0.6 }} value={currentTime} readOnly />
        </FieldRow>

        <FieldRow label="Заменяет кого-то?">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isReplacement}
              onChange={(e) => setIsReplacement(e.target.checked)}
            />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>Да, это замена</span>
          </label>
        </FieldRow>

        {isReplacement && (
          <FieldRow label="Кого заменяет">
            <select
              style={IS}
              value={replacesId}
              onChange={(e) => setReplacesId(e.target.value)}
            >
              <option value="">— выбрать —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </FieldRow>
        )}

        <FieldRow label="Комментарий">
          <textarea
            style={{ ...IS, minHeight: 60, resize: 'vertical' }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Необязательно"
          />
        </FieldRow>

        <div>
          <button
            onClick={handleGeo}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            {geoStatus === 'loading'
              ? 'Определяем...'
              : geoStatus === 'ok'
              ? `${lat!.toFixed(4)}, ${lon!.toFixed(4)}`
              : geoStatus === 'error'
              ? 'Ошибка геолокации'
              : 'Определить местоположение'}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !employeeId}
          style={{
            marginTop: 4,
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            border: 'none',
            borderRadius: 10,
            padding: '9px 0',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving || !employeeId ? 'not-allowed' : 'pointer',
            opacity: saving || !employeeId ? 0.6 : 1,
          }}
        >
          Создать
        </button>
      </div>
    </BpModal>
  );
}

/* ── AttendanceBoard ──────────────────────────────────────────────────────── */

export default function AttendanceBoard() {
  const [items, setItems] = useState<BpAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [createModal, setCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/business-processes/attendance`, {
        headers: authHeaders(),
      });
      if (!res.ok) { setApiError(true); setItems([]); return; }
      const data: unknown = await res.json();
      setItems(Array.isArray(data) ? (data as BpAttendance[]) : []);
      setApiError(false);
    } catch {
      setApiError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (item: BpAttendance, newStatus: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)),
    );
    try {
      await fetch(`${API}/business-processes/attendance/${item.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)),
      );
    }
  };

  const toolbar = (
    <>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
        Отметка на смене
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
        + Новая отметка
      </button>
    </>
  );

  return (
    <>
      <KanbanBoard<BpAttendance>
        columns={ATTENDANCE_COLS}
        items={items}
        loading={loading}
        apiError={apiError}
        renderCard={(item) => <AttendanceCard item={item} />}
        onStatusChange={handleStatusChange}
        onAddClick={() => setCreateModal(true)}
        toolbar={toolbar}
      />
      {createModal && (
        <CreateAttendanceModal onClose={() => setCreateModal(false)} onCreated={load} />
      )}
    </>
  );
}
