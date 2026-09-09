'use client';

import { useEffect, useState } from 'react';
import { API, authHeaders } from '@/lib/auth';

export default function GeneralPage() {
  const [plan, setPlan]       = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch(`${API}/branch-settings`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : {})
      .then((d) => {
        setPlan(d.monthly_sales_plan != null ? String(d.monthly_sales_plan) : '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API}/branch-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ monthly_sales_plan: Number(plan) || 0 }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-lg">
      <h2 className="mb-6 text-subheading text-white">Общие параметры</h2>

      {loading ? (
        <p className="text-body text-gray-500">Загрузка...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-gray-400">
              План продаж на месяц (₽)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="0"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-body text-gray-100 placeholder-gray-600 focus:border-teal/50 focus:outline-none"
            />
            <p className="text-caption text-gray-600">
              Используется на дашборде «Главная» для отображения % выполнения.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start rounded-xl bg-teal px-6 py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : saved ? 'Сохранено ✓' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  );
}
