'use client';

import { useEffect, useState } from 'react';
import { API, authHeaders } from '@/lib/auth';

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export default function MyShiftsPage() {
  const [shifts, setShifts]   = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/shifts/my`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : [])
      .then(setShifts)
      .catch(() => setShifts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h2 className="mb-6 text-subheading text-white">Мои смены / график</h2>

      {loading ? (
        <p className="text-body text-gray-500">Загрузка...</p>
      ) : !shifts.length ? (
        <p className="text-body text-gray-500">У вас нет запланированных смен.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {shifts.map((s) => (
            <div key={s.id} className="glass flex items-center gap-6 rounded-xl px-5 py-4">
              <div className="flex flex-col">
                <span className="text-caption text-gray-500">Дата</span>
                <span className="text-body font-semibold text-gray-100">{s.date}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-caption text-gray-500">Время</span>
                <span className="text-body text-gray-200">{s.start_time} — {s.end_time}</span>
              </div>
              {s.notes && (
                <div className="flex flex-col">
                  <span className="text-caption text-gray-500">Примечание</span>
                  <span className="text-body text-gray-400">{s.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
