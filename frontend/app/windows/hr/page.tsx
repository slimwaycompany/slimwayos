'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, X, Plus, Pencil, Trash2 } from 'lucide-react';
import WindowNav, { type NavSection } from '@/app/components/WindowNav';
import { authHeaders, getUser, API } from '@/lib/auth';

const sections: NavSection[] = [
  { id: 'employees', label: 'Сотрудники' },
  { id: 'shifts',    label: 'График смен' },
];

interface Employee {
  id: string;
  email: string;
  full_name: string;
  is_developer: boolean;
  must_change_password: boolean;
}

interface Shift {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  profiles?: { first_name: string; last_name: string; middle_name?: string };
}

/* ── Employees section ─────────────────────────────────────────────── */

function EmployeesList() {
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [loading, setLoading]       = useState(true);
  const [resetModal, setResetModal] = useState<{ name: string; password: string } | null>(null);
  const isDeveloper = getUser()?.is_developer ?? false;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/employees`, { headers: authHeaders() });
      if (res.ok) setEmployees(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleReset = async (emp: Employee) => {
    try {
      const res = await fetch(`${API}/auth/reset-password/${emp.id}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? 'Ошибка');
      setResetModal({ name: emp.full_name, password: body.temp_password });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сброса пароля');
    }
  };

  if (loading) return <p className="text-body text-gray-500">Загрузка...</p>;
  if (!employees.length) {
    return <p className="text-body text-gray-500">Сотрудники не найдены. Создайте первого в «Настройках филиала».</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {employees.map((emp) => (
        <div key={emp.id} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-body font-semibold text-gray-100">{emp.full_name}</p>
            <p className="text-caption text-gray-500">{emp.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {emp.must_change_password && (
              <span className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 text-caption text-yellow-400">
                ждёт смены пароля
              </span>
            )}
            {emp.is_developer && (
              <span className="rounded-full bg-teal/10 border border-teal/20 px-2.5 py-0.5 text-caption text-teal">
                разработчик
              </span>
            )}
            {isDeveloper && (
              <button
                onClick={() => handleReset(emp)}
                title="Сбросить пароль"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-200"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass flex w-[480px] flex-col gap-4 p-8 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-subheading text-white">Пароль сброшен</h3>
              <button
                onClick={() => setResetModal(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
              <p className="text-caption text-yellow-400 font-semibold">
                Запишите и передайте сотруднику — пароль показывается один раз
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-caption text-gray-500">Сотрудник</span>
                <span className="text-body text-gray-200 font-medium">{resetModal.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-caption text-gray-500">Новый временный пароль</span>
                <code className="rounded-lg bg-gray-800 px-4 py-2 text-body font-mono text-teal tracking-widest">
                  {resetModal.password}
                </code>
              </div>
            </div>
            <button
              onClick={() => setResetModal(null)}
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

/* ── Shifts section ────────────────────────────────────────────────── */

const EMPTY_SHIFT = { user_id: '', date: '', start_time: '', end_time: '', notes: '' };

function ShiftsSection() {
  const [shifts, setShifts]     = useState<Shift[]>([]);
  const [loading, setLoading]   = useState(true);
  const [employees, setEmps]    = useState<Employee[]>([]);
  const [modal, setModal]       = useState<{ shift: Partial<Shift> | null; open: boolean }>({
    shift: null,
    open: false,
  });
  const [form, setForm]         = useState(EMPTY_SHIFT);
  const [saving, setSaving]     = useState(false);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/shifts`, { headers: authHeaders() });
      if (res.ok) setShifts(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
    fetch(`${API}/auth/employees`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : [])
      .then(setEmps);
  }, [fetchShifts]);

  const openNew = () => {
    setForm(EMPTY_SHIFT);
    setModal({ shift: null, open: true });
  };

  const openEdit = (s: Shift) => {
    setForm({ user_id: s.user_id, date: s.date, start_time: s.start_time, end_time: s.end_time, notes: s.notes ?? '' });
    setModal({ shift: s, open: true });
  };

  const closeModal = () => setModal({ shift: null, open: false });

  const handleSave = async () => {
    setSaving(true);
    try {
      const isEdit = Boolean(modal.shift?.id);
      const url = isEdit ? `${API}/shifts/${modal.shift!.id}` : `${API}/shifts`;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Ошибка');
      await fetchShifts();
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить смену?')) return;
    await fetch(`${API}/shifts/${id}`, { method: 'DELETE', headers: authHeaders() });
    await fetchShifts();
  };

  const empName = (s: Shift) => {
    if (s.profiles) {
      const { first_name, last_name } = s.profiles;
      return `${last_name} ${first_name}`.trim();
    }
    const emp = employees.find((e) => e.id === s.user_id);
    return emp?.full_name ?? s.user_id;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-body text-gray-400">Управление графиком смен сотрудников</p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80"
        >
          <Plus className="h-4 w-4" />
          Добавить смену
        </button>
      </div>

      {loading ? (
        <p className="text-body text-gray-500">Загрузка...</p>
      ) : !shifts.length ? (
        <p className="text-body text-gray-600">Смен нет. Добавьте первую.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body">
            <thead>
              <tr className="border-b border-white/8 text-caption text-gray-500">
                <th className="pb-2 pr-4 font-medium">Сотрудник</th>
                <th className="pb-2 pr-4 font-medium">Дата</th>
                <th className="pb-2 pr-4 font-medium">Начало</th>
                <th className="pb-2 pr-4 font-medium">Конец</th>
                <th className="pb-2 pr-4 font-medium">Примечание</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2.5 pr-4 text-gray-200">{empName(s)}</td>
                  <td className="py-2.5 pr-4 text-gray-300">{s.date}</td>
                  <td className="py-2.5 pr-4 text-gray-300">{s.start_time}</td>
                  <td className="py-2.5 pr-4 text-gray-300">{s.end_time}</td>
                  <td className="py-2.5 pr-4 text-gray-500 max-w-[160px] truncate">{s.notes ?? '—'}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-gray-200 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"
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

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass flex w-[480px] flex-col gap-5 p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-subheading text-white">
                {modal.shift?.id ? 'Редактировать смену' : 'Новая смена'}
              </h3>
              <button onClick={closeModal} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-caption text-gray-400">Сотрудник</label>
                <select
                  value={form.user_id}
                  onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-body text-gray-100 focus:border-teal/50 focus:outline-none"
                >
                  <option value="">— выберите —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-caption text-gray-400">Дата</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-body text-gray-100 focus:border-teal/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-caption text-gray-400">Начало</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-body text-gray-100 focus:border-teal/50 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-caption text-gray-400">Конец</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-body text-gray-100 focus:border-teal/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-caption text-gray-400">Примечание</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="необязательно"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-body text-gray-100 placeholder-gray-600 focus:border-teal/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="rounded-xl border border-white/10 px-5 py-2 text-body text-gray-400 hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-teal px-5 py-2 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */

export default function HrPage() {
  const [active, setActive] = useState(sections[0].id);
  const current = sections.find((s) => s.id === active)!;

  return (
    <div className="flex h-full flex-1">
      <WindowNav sections={sections} active={active} onSelect={setActive} />
      <main className="flex-1 overflow-auto p-6">
        {active === 'employees' ? (
          <>
            <h2 className="text-subheading text-white mb-4">Сотрудники</h2>
            <EmployeesList />
          </>
        ) : (
          <>
            <h2 className="text-subheading text-white mb-4">{current.label}</h2>
            <ShiftsSection />
          </>
        )}
      </main>
    </div>
  );
}
