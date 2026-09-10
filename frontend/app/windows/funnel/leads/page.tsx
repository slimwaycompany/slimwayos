'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Download, BarChart2, User, Phone } from 'lucide-react';
import { API, authHeaders } from '@/lib/auth';

/* ─── Types ──────────────────────────────────────────────────────────────── */

type LeadStatus = 'new' | 'in_progress' | 'qualified' | 'trial' | 'success' | 'fail';

interface Lead {
  id: string;
  full_name: string;
  phone?: string;
  source?: string;
  status: LeadStatus;
  funnel_column_id?: string | null;
  created_at: string;
  status_changed_at?: string;
  assigned_to?: string;
  notes?: string;
}

interface Column {
  id: string;
  name: string;
  color: string;
  status_key?: string;
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const DEFAULT_COLUMNS: Column[] = [
  { id: 'new',         name: 'Новый',        color: '#3b82f6', status_key: 'new' },
  { id: 'in_progress', name: 'В работе',     color: '#8b5cf6', status_key: 'in_progress' },
  { id: 'qualified',   name: 'Квалифицирован', color: '#f59e0b', status_key: 'qualified' },
  { id: 'trial',       name: 'Пробное',      color: '#06b6d4', status_key: 'trial' },
  { id: 'success',     name: 'Сделка',       color: '#10b981', status_key: 'success' },
  { id: 'fail',        name: 'Отказ',        color: '#ef4444', status_key: 'fail' },
];

const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', site: 'Сайт', tilda: 'Tilda',
  recommendation: 'Рекомендация', call: 'Звонок', whatsapp: 'WhatsApp',
  manual: 'Вручную', other: 'Другое',
};

/* ─── Utilities ──────────────────────────────────────────────────────────── */

function daysAgo(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function timerColor(days: number): string {
  if (days <= 1) return '#10b981';
  if (days <= 3) return '#f59e0b';
  return '#ef4444';
}

/* ─── Lead card ───────────────────────────────────────────────────────────── */

function LeadCard({ lead, onDragStart }: { lead: Lead; onDragStart: () => void }) {
  const days = daysAgo(lead.status_changed_at ?? lead.created_at);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="rounded-xl border border-white/8 p-3 cursor-grab transition-shadow hover:shadow-lg"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-body font-semibold text-gray-100 truncate">{lead.full_name}</span>
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-caption font-semibold tabular-nums"
          style={{ background: `${timerColor(days)}22`, color: timerColor(days) }}
        >
          {days}д
        </span>
      </div>
      {lead.phone && (
        <div className="mt-1.5 flex items-center gap-1 text-caption text-gray-500">
          <Phone className="h-3 w-3" />{lead.phone}
        </div>
      )}
      {lead.source && (
        <div className="mt-1.5">
          <span className="rounded-full bg-white/6 px-1.5 py-0.5 text-caption text-gray-400">
            {SOURCE_LABELS[lead.source] ?? lead.source}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Create lead form ───────────────────────────────────────────────────── */

function CreateLeadModal({ initialStatus, onClose, onCreate }: {
  initialStatus: LeadStatus;
  onClose: () => void;
  onCreate: (lead: Lead) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone]       = useState('');
  const [source, setSource]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const submit = async () => {
    if (!fullName.trim()) { setError('Введите имя'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone || undefined, source: source || 'manual', status: initialStatus }),
      });
      if (!res.ok) throw new Error('Ошибка создания лида');
      const lead: Lead = await res.json();
      onCreate(lead);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="glass w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-body font-bold text-white">Новый лид</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mb-3 text-caption text-red-400">{error}</p>}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-gray-400">Имя *</label>
            <input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
              className="glass rounded-xl px-4 py-2.5 text-body text-gray-100 outline-none"
              placeholder="Иванов Иван"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-gray-400">Телефон</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass rounded-xl px-4 py-2.5 text-body text-gray-100 outline-none"
              placeholder="+7 700 000 0000"
              type="tel"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-gray-400">Источник</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="glass rounded-xl px-4 py-2.5 text-body text-gray-300 outline-none cursor-pointer"
              style={{ background: '#0d0d1a' }}
            >
              <option value="">— выберите —</option>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => void submit()}
            disabled={saving || !fullName.trim()}
            className="flex-1 rounded-xl bg-teal py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Создание...' : 'Создать'}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-body text-gray-400 hover:text-gray-200"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function LeadsPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch]     = useState('');
  const [createCol, setCreateCol] = useState<LeadStatus | null>(null);
  const draggingRef               = useRef<Lead | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/leads`, { headers: authHeaders() });
      if (!res.ok) throw new Error('no api');
      const data: Lead[] = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setApiError(true);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    return !q || l.full_name.toLowerCase().includes(q) || (l.phone ?? '').includes(q);
  });

  const leadsInCol = (col: Column): Lead[] =>
    filteredLeads.filter((l) => {
      if (col.status_key) return l.status === col.status_key;
      return l.funnel_column_id === col.id;
    });

  const handleDrop = async (col: Column) => {
    const lead = draggingRef.current;
    if (!lead || lead.status === col.status_key) { draggingRef.current = null; setDragOverCol(null); return; }
    const newStatus = (col.status_key as LeadStatus) ?? lead.status;
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status: newStatus } : l));
    draggingRef.current = null;
    setDragOverCol(null);
    try {
      await fetch(`${API}/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      await load();
    }
  };

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(filteredLeads.map((l) => ({
      'Имя': l.full_name,
      'Телефон': l.phone ?? '',
      'Статус': DEFAULT_COLUMNS.find((c) => c.status_key === l.status)?.name ?? l.status,
      'Источник': SOURCE_LABELS[l.source ?? ''] ?? l.source ?? '',
      'Дней': daysAgo(l.status_changed_at ?? l.created_at),
      'Создан': new Date(l.created_at).toLocaleDateString('ru-RU'),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Лиды');
    XLSX.writeFile(wb, 'leads.xlsx');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-800 px-4 py-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            className="glass w-full rounded-lg py-1.5 pl-8 pr-3 text-caption text-gray-200 outline-none"
          />
        </div>
        <button
          onClick={() => void exportToExcel()}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-caption text-gray-400 transition-colors hover:bg-white/8 hover:text-gray-200"
        >
          <Download className="h-3.5 w-3.5" />
          Excel
        </button>
        <button
          onClick={() => setCreateCol('new')}
          className="flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-caption font-semibold text-gray-950"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Новый лид
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center text-caption text-gray-500">
          Загрузка...
        </div>
      ) : apiError ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <BarChart2 className="mx-auto mb-3 h-10 w-10 text-gray-600" />
            <p className="text-body text-gray-400">API лидов не подключён</p>
            <p className="mt-1 text-caption text-gray-600">Эндпоинт /leads будет добавлен в следующей версии</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 gap-3 overflow-x-auto px-4 py-3">
          {DEFAULT_COLUMNS.map((col) => {
            const colLeads = leadsInCol(col);
            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => void handleDrop(col)}
                style={{
                  width: 220,
                  minWidth: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  border: `2px solid ${dragOverCol === col.id ? col.color : 'transparent'}`,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'border-color 150ms ease-out',
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: col.color }}
                    />
                    <span className="text-body font-medium text-gray-300">{col.name}</span>
                  </div>
                  <span className="text-caption text-gray-500">{colLeads.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
                  {colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={() => { draggingRef.current = lead; }}
                    />
                  ))}
                  {colLeads.length === 0 && (
                    <div className="mt-8 text-center text-caption text-gray-600">Нет лидов</div>
                  )}
                </div>

                {/* Add button */}
                <button
                  onClick={() => setCreateCol(col.status_key as LeadStatus ?? 'new')}
                  className="mx-2 mb-2 flex items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 py-2 text-caption text-gray-600 transition-colors hover:border-white/20 hover:text-gray-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {createCol !== null && (
        <CreateLeadModal
          initialStatus={createCol}
          onClose={() => setCreateCol(null)}
          onCreate={(lead) => {
            setLeads((prev) => [lead, ...prev]);
            setCreateCol(null);
          }}
        />
      )}
    </div>
  );
}
