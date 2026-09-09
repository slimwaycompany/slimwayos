'use client';

import { useEffect, useState } from 'react';
import { API, authHeaders } from '@/lib/auth';

interface Achievement { id: string; title: string; description?: string; achieved_at: string; }
interface ProfileData {
  id: string; full_name?: string; first_name?: string; last_name?: string; middle_name?: string;
  birth_date?: string; created_at?: string; position?: string; department?: string; bio?: string;
  photo_url?: string;
  manager?: { id: string; full_name?: string; first_name?: string; last_name?: string } | null;
  subordinates?: { id: string; full_name?: string }[];
  achievements?: Achievement[];
}

const inputCls = 'w-full glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none placeholder-gray-600 bg-transparent';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-caption text-gray-400">{label}</label>
      {children}
    </div>
  );
}

export default function PersonalDataPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', middle_name: '', birth_date: '',
    position: '', department: '', bio: '', photo_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/profile/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setForm({
          first_name:  data.first_name  ?? '',
          last_name:   data.last_name   ?? '',
          middle_name: data.middle_name ?? '',
          birth_date:  data.birth_date  ?? '',
          position:    data.position    ?? '',
          department:  data.department  ?? '',
          bio:         data.bio         ?? '',
          photo_url:   data.photo_url   ?? '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.message ?? 'Ошибка'); }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6"><p className="text-body text-gray-500">Загрузка...</p></div>;
  }

  const managerName = profile?.manager
    ? [profile.manager.last_name, profile.manager.first_name].filter(Boolean).join(' ')
      || profile.manager.full_name
    : null;

  const avatarLetter = (form.first_name?.[0] ?? form.last_name?.[0] ?? '?').toUpperCase();

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-subheading text-white mb-6">Личные данные</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-2xl glass overflow-hidden flex items-center justify-center shrink-0">
          {form.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photo_url} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-heading text-gray-600">{avatarLetter}</span>
          )}
        </div>
        <Field label="URL фото">
          <input type="url" value={form.photo_url} onChange={set('photo_url')}
            placeholder="https://..." className={inputCls} />
        </Field>
      </div>

      {/* Name grid */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Фамилия">
          <input type="text" value={form.last_name} onChange={set('last_name')} className={inputCls} />
        </Field>
        <Field label="Имя">
          <input type="text" value={form.first_name} onChange={set('first_name')} className={inputCls} />
        </Field>
        <Field label="Отчество">
          <input type="text" value={form.middle_name} onChange={set('middle_name')} className={inputCls} />
        </Field>
        <Field label="Дата рождения">
          <input type="date" value={form.birth_date} onChange={set('birth_date')} className={inputCls} />
        </Field>
        <Field label="Должность">
          <input type="text" value={form.position} onChange={set('position')} className={inputCls} />
        </Field>
        <Field label="Отдел">
          <input type="text" value={form.department} onChange={set('department')} className={inputCls} />
        </Field>
      </div>

      {/* Read-only fields */}
      <div className="mt-4 flex flex-col gap-1.5">
        <label className="text-caption text-gray-400">Дата регистрации</label>
        <div className="glass rounded-xl px-4 py-2.5 text-body text-gray-500">
          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '—'}
        </div>
      </div>

      {managerName && (
        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-caption text-gray-400">Руководитель</label>
          <div className="glass rounded-xl px-4 py-2.5 text-body text-gray-300">{managerName}</div>
        </div>
      )}

      {profile?.subordinates && profile.subordinates.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-caption text-gray-400">Подчинённые</label>
          <div className="flex flex-wrap gap-2">
            {profile.subordinates.map((s) => (
              <span key={s.id} className="glass rounded-lg px-3 py-1 text-body text-gray-300">
                {s.full_name ?? s.id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      <div className="mt-4 flex flex-col gap-1.5">
        <label className="text-caption text-gray-400">О себе</label>
        <textarea value={form.bio} onChange={set('bio')} rows={3}
          placeholder="Расскажите о себе..."
          className="w-full glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none resize-none placeholder-gray-600 bg-transparent" />
      </div>

      {/* Achievements (read-only) */}
      {profile?.achievements && profile.achievements.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-caption text-gray-400">Достижения</label>
          {profile.achievements.map((a) => (
            <div key={a.id} className="glass rounded-xl px-4 py-3">
              <p className="text-body font-medium text-gray-200">{a.title}</p>
              {a.description && <p className="text-caption text-gray-500 mt-0.5">{a.description}</p>}
              <p className="text-caption text-gray-600 mt-1">
                {new Date(a.achieved_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-body text-red-400">
          {error}
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="mt-6 w-full rounded-xl bg-teal py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:opacity-50">
        {saving ? 'Сохранение...' : saved ? 'Сохранено ✓' : 'Сохранить'}
      </button>
    </div>
  );
}
