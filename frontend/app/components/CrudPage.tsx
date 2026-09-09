'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { API, authHeaders } from '@/lib/auth';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'toggle' | 'time';
  options?: { value: string; label: string }[];
  asyncEntity?: string;
  required?: boolean;
  hideInTable?: boolean;
}

export interface CrudConfig {
  title: string;
  entity: string;
  fields: FieldDef[];
  tableKeys: string[];
}

type Row = Record<string, unknown>;

function displayVal(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Да' : 'Нет';
  const s = String(val);
  return s.length > 50 ? s.slice(0, 50) + '…' : s;
}

const inputCls =
  'w-full glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none placeholder-gray-600 bg-transparent';
const selectCls =
  'w-full glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none cursor-pointer';

interface ModalProps {
  config: CrudConfig;
  item: Row | null;
  asyncOptions: Record<string, { value: string; label: string }[]>;
  onClose: () => void;
  onSave: (data: Row) => Promise<void>;
}

function CrudModal({ config, item, asyncOptions, onClose, onSave }: ModalProps) {
  const isNew = !item?.id;
  const [form, setForm] = useState<Row>(() => {
    const init: Row = {};
    for (const f of config.fields) {
      const raw = item?.[f.key];
      if (f.type === 'toggle') init[f.key] = raw ? 'true' : 'false';
      else init[f.key] = raw ?? '';
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: string) => setForm((s) => ({ ...s, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data: Row = {};
      for (const f of config.fields) {
        const v = form[f.key];
        if (v === '' || v === null || v === undefined) continue;
        if (f.type === 'number') data[f.key] = Number(v);
        else if (f.type === 'toggle') data[f.key] = v === 'true';
        else data[f.key] = v;
      }
      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass flex w-[560px] max-h-[85vh] flex-col shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-subheading text-white">{isNew ? 'Добавить' : 'Редактировать'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto px-6 pb-4 flex flex-col gap-4">
            {config.fields.map((f) => {
              const opts = f.asyncEntity
                ? (asyncOptions[f.asyncEntity] ?? [])
                : (f.options ?? []);
              const val = String(form[f.key] ?? '');

              return (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-caption text-gray-400">{f.label}</label>

                  {f.type === 'textarea' ? (
                    <textarea
                      value={val}
                      onChange={(e) => set(f.key, e.target.value)}
                      rows={4}
                      className={inputCls + ' resize-none'}
                    />
                  ) : f.type === 'toggle' ? (
                    <select
                      value={val}
                      onChange={(e) => set(f.key, e.target.value)}
                      className={selectCls}
                      style={{ background: '#0d0d1a' }}
                    >
                      <option value="false">Нет</option>
                      <option value="true">Да</option>
                    </select>
                  ) : f.type === 'select' || f.asyncEntity ? (
                    <select
                      value={val}
                      onChange={(e) => set(f.key, e.target.value)}
                      className={selectCls}
                      style={{ background: '#0d0d1a' }}
                    >
                      <option value="">— выбрать —</option>
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={
                        f.type === 'number' ? 'number' :
                        f.type === 'date' ? 'date' :
                        f.type === 'time' ? 'time' : 'text'
                      }
                      required={f.required}
                      value={val}
                      onChange={(e) => set(f.key, e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>
              );
            })}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-body text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-3 px-6 py-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl glass py-2.5 text-body text-gray-300 transition-opacity hover:opacity-70"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-teal py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CrudPage({ config }: { config: CrudConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<Row | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/catalog/${config.entity}`, { headers: authHeaders() });
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, [config.entity]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const asyncFields = config.fields.filter((f) => f.asyncEntity);
    if (!asyncFields.length) return;
    Promise.all(
      asyncFields.map(async (f) => {
        const res = await fetch(`${API}/catalog/${f.asyncEntity}`, { headers: authHeaders() });
        const data: Row[] = res.ok ? await res.json() : [];
        return [
          f.asyncEntity!,
          data.map((r) => ({ value: String(r.id), label: String(r.name ?? r.id) })),
        ] as const;
      }),
    ).then((pairs) => setAsyncOptions(Object.fromEntries(pairs)));
  }, [config.fields]);

  // Build lookup maps for async fields (for display in table)
  const asyncLookup: Record<string, Record<string, string>> = {};
  for (const f of config.fields) {
    if (f.asyncEntity && asyncOptions[f.asyncEntity]) {
      asyncLookup[f.key] = Object.fromEntries(
        asyncOptions[f.asyncEntity].map((o) => [o.value, o.label]),
      );
    }
  }

  const openNew = () => { setModalItem({}); setModalOpen(true); };
  const openEdit = (row: Row) => { setModalItem(row); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSave = async (data: Row) => {
    const id = modalItem?.id;
    const url = id
      ? `${API}/catalog/${config.entity}/${id}`
      : `${API}/catalog/${config.entity}`;
    const res = await fetch(url, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message ?? 'Ошибка');
    closeModal();
    refresh();
  };

  const handleDelete = async (id: unknown) => {
    if (!confirm('Удалить запись?')) return;
    await fetch(`${API}/catalog/${config.entity}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    refresh();
  };

  const tableFields = config.fields.filter((f) => config.tableKeys.includes(f.key));

  return (
    <div className="flex flex-col p-6 h-full">
      <div className="flex shrink-0 items-center justify-between mb-5">
        <h2 className="text-subheading text-white">{config.title}</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      {loading ? (
        <p className="text-body text-gray-500">Загрузка...</p>
      ) : !rows.length ? (
        <div className="glass rounded-xl p-10 text-center">
          <p className="text-body text-gray-500">Нет записей. Нажмите «Добавить».</p>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse text-body">
            <thead>
              <tr>
                {tableFields.map((f) => (
                  <th
                    key={f.key}
                    className="px-4 py-2.5 text-left text-caption text-gray-500 font-medium border-b border-white/5 whitespace-nowrap"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="w-20 border-b border-white/5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={String(row.id ?? i)}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  {tableFields.map((f) => (
                    <td key={f.key} className="px-4 py-2.5 text-gray-300">
                      {f.asyncEntity
                        ? (asyncLookup[f.key]?.[String(row[f.key])] ?? displayVal(row[f.key]))
                        : displayVal(row[f.key])}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(row)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CrudModal
          config={config}
          item={modalItem}
          asyncOptions={asyncOptions}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
