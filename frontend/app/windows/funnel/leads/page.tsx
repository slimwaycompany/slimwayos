'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Download, User, Phone, ChevronDown, Check } from 'lucide-react';
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
  notes?: string;
}

interface Column {
  id: string;
  name: string;
  color: string;
  status_key?: string;
}

interface Funnel {
  id: string;
  name: string;
  columns: Column[];
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const DEFAULT_FUNNEL_ID = 'default';

const DEFAULT_COLUMNS: Column[] = [
  { id: 'new',         name: 'Новый',          color: 'var(--color-info)',    status_key: 'new' },
  { id: 'in_progress', name: 'В работе',       color: '#8b5cf6',              status_key: 'in_progress' },
  { id: 'qualified',   name: 'Квалифицирован', color: 'var(--color-warning)', status_key: 'qualified' },
  { id: 'trial',       name: 'Пробное',        color: '#06b6d4',              status_key: 'trial' },
  { id: 'success',     name: 'Сделка',         color: 'var(--color-success)', status_key: 'success' },
  { id: 'fail',        name: 'Отказ',          color: 'var(--color-danger)',  status_key: 'fail' },
];

const DEFAULT_FUNNEL: Funnel = {
  id: DEFAULT_FUNNEL_ID,
  name: 'Основная воронка',
  columns: DEFAULT_COLUMNS,
};

const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', site: 'Сайт', tilda: 'Tilda',
  recommendation: 'Рекомендация', call: 'Звонок', whatsapp: 'WhatsApp',
  manual: 'Вручную', other: 'Другое',
};

const COL_COLORS = [
  'var(--color-info)', '#8b5cf6', 'var(--color-warning)',
  '#06b6d4', 'var(--color-success)', 'var(--color-danger)',
  '#f97316', '#ec4899', '#14b8a6', '#6366f1',
];

const MAX_COLUMNS = 10;

/* ─── Storage helpers ─────────────────────────────────────────────────────── */

function loadFunnels(): Funnel[] {
  if (typeof window === 'undefined') return [DEFAULT_FUNNEL];
  try {
    const raw = localStorage.getItem('slimway_funnels');
    if (!raw) return [DEFAULT_FUNNEL];
    const parsed = JSON.parse(raw) as Funnel[];
    const hasDefault = parsed.some((f) => f.id === DEFAULT_FUNNEL_ID);
    return hasDefault ? parsed : [DEFAULT_FUNNEL, ...parsed];
  } catch {
    return [DEFAULT_FUNNEL];
  }
}

function saveFunnels(funnels: Funnel[]) {
  localStorage.setItem('slimway_funnels', JSON.stringify(funnels));
}

function loadActiveFunnelId(): string {
  if (typeof window === 'undefined') return DEFAULT_FUNNEL_ID;
  return localStorage.getItem('slimway_active_funnel') ?? DEFAULT_FUNNEL_ID;
}

function saveActiveFunnelId(id: string) {
  localStorage.setItem('slimway_active_funnel', id);
}

/* ─── Utilities ──────────────────────────────────────────────────────────── */

function daysAgo(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function timerColor(days: number): string {
  if (days <= 1) return 'var(--color-success)';
  if (days <= 3) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ─── Lead card ───────────────────────────────────────────────────────────── */

function LeadCard({ lead, onDragStart }: { lead: Lead; onDragStart: () => void }) {
  const days = daysAgo(lead.status_changed_at ?? lead.created_at);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 12px',
        cursor: 'grab',
        background: 'rgba(255,255,255,0.03)',
        transition: 'box-shadow 150ms ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.full_name}</span>
        <span
          style={{
            flexShrink: 0,
            borderRadius: 20,
            padding: '1px 6px',
            fontSize: 11,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            background: `color-mix(in srgb, ${timerColor(days)} 15%, transparent)`,
            color: timerColor(days),
          }}
        >
          {days}д
        </span>
      </div>
      {lead.phone && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
          <Phone size={10} />{lead.phone}
        </div>
      )}
      {lead.source && (
        <div style={{ marginTop: 5 }}>
          <span style={{ borderRadius: 20, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)' }}>
            {SOURCE_LABELS[lead.source] ?? lead.source}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Create Lead Modal ──────────────────────────────────────────────────── */

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: 24 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 360, borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Новый лид</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {error && <p style={{ marginBottom: 12, fontSize: 12, color: 'var(--color-danger)' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Имя *</label>
            <input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
              className="glass"
              style={{ borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', border: '1px solid var(--border)' }}
              placeholder="Иванов Иван"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Телефон</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass"
              style={{ borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', border: '1px solid var(--border)' }}
              placeholder="+7 700 000 0000"
              type="tel"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Источник</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="glass"
              style={{ borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
            >
              <option value="">— выберите —</option>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => void submit()}
            disabled={saving || !fullName.trim()}
            style={{ flex: 1, borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 600, padding: '10px', cursor: saving || !fullName.trim() ? 'not-allowed' : 'pointer', opacity: saving || !fullName.trim() ? 0.5 : 1, transition: 'opacity 150ms ease-out' }}
          >
            {saving ? 'Создание...' : 'Создать'}
          </button>
          <button
            onClick={onClose}
            style={{ borderRadius: 10, border: '1px solid var(--border)', padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Funnel Modal ────────────────────────────────────────────────── */

function CreateFunnelModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (funnel: Funnel) => void;
}) {
  const [name, setName] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      id: uid(),
      name: name.trim(),
      columns: [
        { id: uid(), name: 'Новые', color: COL_COLORS[0] },
        { id: uid(), name: 'В работе', color: COL_COLORS[1] },
        { id: uid(), name: 'Закрытые', color: COL_COLORS[4] },
      ],
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: 24 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 360, borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Новая воронка</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Название воронки</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            className="glass"
            style={{ borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', border: '1px solid var(--border)' }}
            placeholder="Например: Холодные лиды"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={submit}
            disabled={!name.trim()}
            style={{ flex: 1, borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 600, padding: '10px', cursor: !name.trim() ? 'not-allowed' : 'pointer', opacity: !name.trim() ? 0.5 : 1 }}
          >
            Создать
          </button>
          <button onClick={onClose} style={{ borderRadius: 10, border: '1px solid var(--border)', padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Column Modal ────────────────────────────────────────────────────── */

function AddColumnModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (col: Column) => void;
}) {
  const [name, setName]   = useState('');
  const [color, setColor] = useState(COL_COLORS[0]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: 24 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 360, borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Новая колонка</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Название</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onAdd({ id: uid(), name: name.trim(), color }); }}
              className="glass"
              style={{ borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', border: '1px solid var(--border)' }}
              placeholder="Название этапа"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Цвет</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {COL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {color === c && <Check size={12} color="#fff" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { if (name.trim()) onAdd({ id: uid(), name: name.trim(), color }); }}
            disabled={!name.trim()}
            style={{ flex: 1, borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 600, padding: '10px', cursor: !name.trim() ? 'not-allowed' : 'pointer', opacity: !name.trim() ? 0.5 : 1 }}
          >
            Добавить
          </button>
          <button onClick={onClose} style={{ borderRadius: 10, border: '1px solid var(--border)', padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Funnel Dropdown ─────────────────────────────────────────────────────── */

function FunnelDropdown({ funnels, activeId, onSelect, onCreateClick }: {
  funnels: Funnel[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const active          = funnels.find((f) => f.id === activeId) ?? funnels[0];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
      >
        {active?.name ?? 'Воронка'}
        <ChevronDown size={13} color="var(--text-muted)" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4, minWidth: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
          {funnels.map((f) => (
            <button
              key={f.id}
              onClick={() => { onSelect(f.id); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', textAlign: 'left', background: f.id === activeId ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: f.id === activeId ? 'var(--accent)' : 'var(--text)', borderBottom: '1px solid var(--border)' }}
            >
              {f.id === activeId && <Check size={12} />}
              {f.name}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{f.columns.length} колонок</span>
            </button>
          ))}
          <button
            onClick={() => { setOpen(false); onCreateClick(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}
          >
            <Plus size={13} />
            Создать воронку
          </button>
        </div>
      )}
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

  // Funnel state
  const [funnels, setFunnels]           = useState<Funnel[]>([DEFAULT_FUNNEL]);
  const [activeFunnelId, setActiveFunnelId] = useState<string>(DEFAULT_FUNNEL_ID);
  const [showCreateFunnel, setShowCreateFunnel] = useState(false);
  const [showAddColumn, setShowAddColumn]       = useState(false);

  useEffect(() => {
    setFunnels(loadFunnels());
    setActiveFunnelId(loadActiveFunnelId());
  }, []);

  const activeFunnel = funnels.find((f) => f.id === activeFunnelId) ?? funnels[0] ?? DEFAULT_FUNNEL;
  const columns = activeFunnel.columns;

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
    if (!lead) { draggingRef.current = null; setDragOverCol(null); return; }
    const newStatus = col.status_key ? (col.status_key as LeadStatus) : lead.status;
    const newColId  = col.status_key ? null : col.id;
    if (lead.status === newStatus && lead.funnel_column_id === newColId) {
      draggingRef.current = null; setDragOverCol(null); return;
    }
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status: newStatus, funnel_column_id: newColId } : l));
    draggingRef.current = null;
    setDragOverCol(null);
    try {
      await fetch(`${API}/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: newStatus, funnel_column_id: newColId }),
      });
    } catch {
      await load();
    }
  };

  const handleSelectFunnel = (id: string) => {
    setActiveFunnelId(id);
    saveActiveFunnelId(id);
  };

  const handleCreateFunnel = (funnel: Funnel) => {
    const next = [...funnels, funnel];
    setFunnels(next);
    saveFunnels(next);
    handleSelectFunnel(funnel.id);
    setShowCreateFunnel(false);
  };

  const handleAddColumn = (col: Column) => {
    if (columns.length >= MAX_COLUMNS) return;
    const next = funnels.map((f) =>
      f.id === activeFunnelId ? { ...f, columns: [...f.columns, col] } : f
    );
    setFunnels(next);
    saveFunnels(next);
    setShowAddColumn(false);
  };

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(filteredLeads.map((l) => ({
      'Имя': l.full_name,
      'Телефон': l.phone ?? '',
      'Статус': columns.find((c) => c.status_key === l.status)?.name ?? l.status,
      'Источник': SOURCE_LABELS[l.source ?? ''] ?? l.source ?? '',
      'Дней': daysAgo(l.status_changed_at ?? l.created_at),
      'Создан': new Date(l.created_at).toLocaleDateString('ru-RU'),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Лиды');
    XLSX.writeFile(wb, 'leads.xlsx');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', padding: '10px 16px' }}>
        <FunnelDropdown
          funnels={funnels}
          activeId={activeFunnelId}
          onSelect={handleSelectFunnel}
          onCreateClick={() => setShowCreateFunnel(true)}
        />

        <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 280 }}>
          <User size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', padding: '5px 10px 5px 30px', fontSize: 12, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {!apiError && !loading && columns.length < MAX_COLUMNS && activeFunnelId !== DEFAULT_FUNNEL_ID && (
          <button
            onClick={() => setShowAddColumn(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
          >
            <Plus size={13} />
            Добавить колонку
          </button>
        )}

        <button
          onClick={() => void exportToExcel()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
        >
          <Download size={13} />
          Excel
        </button>

        <button
          onClick={() => setCreateCol('new')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: 'var(--accent-fg)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={13} strokeWidth={2.5} />
          Новый лид
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Загрузка...
        </div>
      ) : apiError ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>API лидов не подключён</p>
            <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>Эндпоинт /leads будет добавлен позже</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, gap: 12, overflowX: 'auto', padding: '12px 16px' }}>
          {columns.map((col) => {
            const colLeads = leadsInCol(col);
            const isOver   = dragOverCol === col.id;
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
                  border: `2px solid ${isOver ? col.color : 'transparent'}`,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'border-color 150ms ease-out',
                }}
              >
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{col.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{colLeads.length}</span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 8, overflowY: 'auto', padding: '0 8px 10px' }}>
                  {colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={() => { draggingRef.current = lead; }}
                    />
                  ))}
                  {colLeads.length === 0 && (
                    <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', opacity: 0.5 }}>Нет лидов</div>
                  )}
                </div>

                {/* Add button */}
                <button
                  onClick={() => setCreateCol((col.status_key as LeadStatus) ?? 'new')}
                  style={{ margin: '0 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, border: '1px dashed var(--border)', padding: '7px', fontSize: 12, color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', transition: 'border-color 150ms ease-out, color 150ms ease-out' }}
                >
                  <Plus size={12} />
                  Добавить
                </button>
              </div>
            );
          })}

          {/* Add column button (visible always when in custom funnel and below max) */}
          {activeFunnelId !== DEFAULT_FUNNEL_ID && columns.length < MAX_COLUMNS && (
            <div style={{ width: 40, minWidth: 40, display: 'flex', alignItems: 'flex-start', paddingTop: 10 }}>
              <button
                onClick={() => setShowAddColumn(true)}
                title="Добавить колонку"
                style={{ width: 40, height: 40, borderRadius: 10, border: '2px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 150ms ease-out, color 150ms ease-out' }}
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {createCol !== null && (
        <CreateLeadModal
          initialStatus={createCol}
          onClose={() => setCreateCol(null)}
          onCreate={(lead) => { setLeads((prev) => [lead, ...prev]); setCreateCol(null); }}
        />
      )}

      {showCreateFunnel && (
        <CreateFunnelModal
          onClose={() => setShowCreateFunnel(false)}
          onCreate={handleCreateFunnel}
        />
      )}

      {showAddColumn && (
        <AddColumnModal
          onClose={() => setShowAddColumn(false)}
          onAdd={handleAddColumn}
        />
      )}
    </div>
  );
}
