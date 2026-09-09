'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import WindowNav, { type NavSection } from '@/app/components/WindowNav';
import { authHeaders, API } from '@/lib/auth';

const sections: NavSection[] = [
  { id: 'employees',    label: 'Сотрудники' },
  { id: 'branches',     label: 'Филиалы' },
  { id: 'general',      label: 'Общие параметры' },
  { id: 'integrations', label: 'Интеграции' },
];

interface TempPasswordModal {
  email: string;
  password: string;
}

function EmployeesSection() {
  const [email, setEmail]       = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState<TempPasswordModal | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ email, full_name: fullName }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? 'Ошибка создания');
      setModal({ email: body.email, password: body.temp_password });
      setEmail('');
      setFullName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm">
      <h2 className="text-subheading text-white mb-6">Добавить сотрудника</h2>

      <form onSubmit={handleCreate} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-caption text-gray-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none placeholder-gray-600"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-caption text-gray-400">ФИО</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Иванов Иван Иванович"
            className="glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none placeholder-gray-600"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-body text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-teal px-6 py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loading ? 'Создание...' : 'Создать сотрудника'}
        </button>
      </form>

      {/* Temp password modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass flex w-[480px] flex-col gap-4 p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-subheading text-white">Сотрудник создан</h3>
              <button
                onClick={() => setModal(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
              <p className="text-caption text-yellow-400 font-semibold mb-1">
                Запишите и передайте сотруднику — пароль показывается один раз
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-caption text-gray-500">Email</span>
                <span className="text-body text-gray-200 font-medium">{modal.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-caption text-gray-500">Временный пароль</span>
                <code className="rounded-lg bg-gray-800 px-4 py-2 text-body font-mono text-teal tracking-widest">
                  {modal.password}
                </code>
              </div>
            </div>

            <button
              onClick={() => setModal(null)}
              className="rounded-xl bg-teal px-6 py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80"
            >
              Понятно, закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BranchSettingsPage() {
  const [active, setActive] = useState(sections[0].id);
  const current = sections.find((s) => s.id === active)!;

  return (
    <div className="flex h-full flex-1">
      <WindowNav sections={sections} active={active} onSelect={setActive} />
      <main className="flex-1 overflow-auto p-6">
        {active === 'employees' ? (
          <EmployeesSection />
        ) : (
          <>
            <h2 className="text-subheading text-white">{current.label}</h2>
            <p className="mt-2 text-body text-gray-400">{current.label} — в разработке</p>
          </>
        )}
      </main>
    </div>
  );
}
