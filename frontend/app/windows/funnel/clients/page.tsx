'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Search, Phone, Mail, Calendar, User } from 'lucide-react';
import { API, authHeaders } from '@/lib/auth';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Client {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  birth_date?: string | null;
  source?: string | null;
  status?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  created_at: string;
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const SOURCE_OPTIONS = [
  { value: '', label: 'Все источники' },
  { value: 'instagram',      label: 'Instagram' },
  { value: 'site',           label: 'Сайт' },
  { value: 'recommendation', label: 'Рекомендация' },
  { value: 'lead',           label: 'Лид' },
  { value: 'call',           label: 'Обзвон' },
  { value: 'whatsapp',       label: 'WhatsApp' },
  { value: 'other',          label: 'Другое' },
];

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  SOURCE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
);

const STATUS_OPTIONS = [
  { value: '',           label: 'Все статусы' },
  { value: 'new_client', label: 'Новый' },
  { value: 'active',     label: 'Активный' },
  { value: 'frozen',     label: 'Заморожен' },
  { value: 'at_risk',    label: 'Под угрозой' },
  { value: 'churned',    label: 'Ушёл' },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
);

const STATUS_COLORS: Record<string, string> = {
  new_client: 'var(--color-info)',
  active:     'var(--color-success)',
  frozen:     'var(--color-warning)',
  at_risk:    'var(--color-warning)',
  churned:    'var(--color-danger)',
};

const CLIENT_SOURCES_CREATE = SOURCE_OPTIONS.slice(1);

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function calcAge(bd: string): number {
  const d = new Date(bd + 'T00:00:00');
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

/* ─── Add Client Modal ────────────────────────────────────────────────────── */

function AddClientModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (c: Client) => void;
}) {
  const [fullName,  setFullName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [source,    setSource]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const inp: React.CSSProperties = {
    width: '100%', height: 36, padding: '0 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  const submit = async () => {
    if (!fullName.trim()) { setError('Введите имя клиента'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          full_name:  fullName.trim(),
          phone:      phone.trim()  || null,
          email:      email.trim()  || null,
          birth_date: birthDate     || null,
          source:     source        || null,
          notes:      notes.trim()  || null,
        }),
      });
      if (!res.ok) {
        const b = await res.json() as { message?: string };
        throw new Error(b.message ?? 'Ошибка');
      }
      const client = await res.json() as Client;
      onSave(client);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: 20 }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 460, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Новый клиент</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={16} /></button>
        </div>

        {error && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)', borderRadius: 8, fontSize: 12, color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Имя *</label>
            <input style={inp} placeholder="Фамилия Имя Отчество" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Телефон</label>
              <input style={inp} placeholder="+7 700 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Email</label>
              <input style={inp} type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Дата рождения</label>
              <input type="date" style={inp} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Источник</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">— не указан —</option>
                {CLIENT_SOURCES_CREATE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Заметки</label>
            <textarea
              style={{ ...inp, height: 64, paddingTop: 8, paddingBottom: 8, resize: 'vertical' }}
              placeholder="Дополнительная информация..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => void submit()}
              disabled={saving}
              style={{ flex: 1, height: 36, borderRadius: 8, background: 'var(--accent)', border: 'none', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Сохранение...' : 'Добавить клиента'}
            </button>
            <button onClick={onClose} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Client Detail Modal ─────────────────────────────────────────────────── */

function ClientDetailModal({ client, onClose }: {
  client: Client;
  onClose: () => void;
}) {
  const statusColor = STATUS_COLORS[client.status ?? ''] ?? 'var(--text-muted)';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: 20 }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: 'var(--accent)',
          }}>
            {initials(client.full_name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {client.full_name}
              {client.status && (
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: `color-mix(in srgb, ${statusColor} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${statusColor} 25%, transparent)`, color: statusColor }}>
                  {STATUS_LABELS[client.status] ?? client.status}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              В базе с {new Date(client.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            client.phone     && { icon: <Phone size={13} />,    label: 'Телефон',         value: client.phone },
            client.email     && { icon: <Mail size={13} />,     label: 'Email',           value: client.email },
            client.birth_date && { icon: <Calendar size={13} />, label: 'Дата рождения',  value: `${new Date(client.birth_date + 'T00:00:00').toLocaleDateString('ru-RU')} (${calcAge(client.birth_date)} лет)` },
            client.source    && { icon: <User size={13} />,     label: 'Источник',        value: SOURCE_LABELS[client.source] ?? client.source },
          ].filter(Boolean).map((row, i) => {
            if (!row) return null;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'color-mix(in srgb, var(--text) 3%, transparent)', borderRadius: 10 }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{row.icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 100, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{row.value}</span>
              </div>
            );
          })}

          {client.tags && client.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
              {client.tags.map((t) => (
                <span key={t} style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', color: 'var(--accent)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {client.notes && (
            <div style={{ padding: '10px 12px', background: 'color-mix(in srgb, var(--text) 3%, transparent)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Заметки</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{client.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function ClientsPage() {
  const [clients,    setClients]    = useState<Client[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [apiError,   setApiError]   = useState(false);
  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState('');
  const [sourceF,    setSourceF]    = useState('');
  const [selected,   setSelected]   = useState<Client | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search)  params.set('search', search);
      if (statusF) params.set('status', statusF);
      if (sourceF) params.set('source', sourceF);
      const res = await fetch(`${API}/clients?${params.toString()}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json() as Client[] | { data: Client[] };
      const list  = Array.isArray(data) ? data : (data as { data: Client[] }).data ?? [];
      setClients(list);
    } catch {
      setApiError(true);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusF, sourceF]);

  useEffect(() => { void load(); }, [load]);

  const sel: React.CSSProperties = {
    height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text)', fontSize: 12, outline: 'none', cursor: 'pointer',
  };

  const inp: React.CSSProperties = {
    height: 32, padding: '0 10px 0 30px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', padding: '10px 0', marginBottom: 0 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={inp}
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select style={sel} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select style={sel} value={sourceF} onChange={(e) => setSourceF(e.target.value)}>
          {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: 'var(--accent-fg)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Добавить клиента
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Загрузка...
        </div>
      ) : apiError ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <User size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>API клиентов не подключён</p>
            <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>Эндпоинт /clients будет добавлен позже</p>
          </div>
        </div>
      ) : clients.length === 0 ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          {search || statusF || sourceF ? 'Нет клиентов по фильтру' : 'База клиентов пуста'}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Клиент', 'Телефон', 'Email', 'Источник', 'Статус', 'В базе с'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const sc = STATUS_COLORS[c.status ?? ''] ?? 'var(--text-muted)';
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 150ms ease-out' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'color-mix(in srgb, var(--text) 3%, transparent)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                          {initials(c.full_name)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{c.phone ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{c.email ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{SOURCE_LABELS[c.source ?? ''] ?? c.source ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {c.status ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: `color-mix(in srgb, ${sc} 10%, transparent)`, color: sc, border: `1px solid color-mix(in srgb, ${sc} 25%, transparent)` }}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onSave={(c) => { setClients((prev) => [c, ...prev]); setShowAdd(false); }}
        />
      )}

      {selected && (
        <ClientDetailModal client={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
