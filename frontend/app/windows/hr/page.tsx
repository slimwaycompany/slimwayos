'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, X } from 'lucide-react';
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

  if (loading) {
    return <p className="text-body text-gray-500">Загрузка...</p>;
  }

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

      {/* Reset password modal */}
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
            <h2 className="text-subheading text-white">{current.label}</h2>
            <p className="mt-2 text-body text-gray-400">{current.label} — в разработке</p>
          </>
        )}
      </main>
    </div>
  );
}
