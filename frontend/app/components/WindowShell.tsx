'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageSquare, HelpCircle, Bell, LayoutList, Cloud, LogOut } from 'lucide-react';
import { clearSession, callLogoutApi } from '@/lib/auth';

const rightItems = [
  { icon: MessageSquare, label: 'Чат' },
  { icon: HelpCircle,    label: 'Подсказки' },
  { icon: Bell,          label: 'Уведомления' },
  { icon: LayoutList,    label: 'Сводка' },
];

interface WindowShellProps {
  title: string;
  children: React.ReactNode;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}д ${h}ч`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function WindowShell({ title, children }: WindowShellProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await callLogoutApi();
    clearSession();
    router.push('/login');
  };
  const [time, setTime]             = useState('');
  const [weather, setWeather]       = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [uptime, setUptime]         = useState<number | null>(null);
  const [successRate, setSuccessRate] = useState(100);
  const checksRef = useRef({ total: 0, success: 0 });

  // Clock — update every minute
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // Weather — fetch from Open-Meteo using saved location, refresh every 15 min
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const raw = localStorage.getItem('slimway_location');
        if (!raw) { setWeather(null); return; }
        const loc = JSON.parse(raw) as { lat?: number | null; lon?: number | null };
        if (!loc.lat || !loc.lon) { setWeather(null); return; }
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`,
        );
        if (!res.ok) { setWeather(null); return; }
        const data = await res.json();
        setWeather(`${Math.round(data.current_weather.temperature)}°C`);
      } catch {
        setWeather(null);
      }
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Server health — poll /health every 30 s, track success rate and uptime
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const checkHealth = async () => {
      checksRef.current.total += 1;
      try {
        const res = await fetch(`${apiBase}/api/v1/health`);
        if (res.ok) {
          const data = await res.json();
          checksRef.current.success += 1;
          setServerOnline(true);
          if (typeof data.uptime === 'number') setUptime(data.uptime);
        } else {
          setServerOnline(false);
        }
      } catch {
        setServerOnline(false);
      }
      const { total, success } = checksRef.current;
      setSuccessRate(total > 0 ? Math.round((success / total) * 100) : 100);
    };
    checkHealth();
    const id = setInterval(checkHealth, 30_000);
    return () => clearInterval(id);
  }, []);

  const serverTooltip = [
    serverOnline ? 'Сервер онлайн' : 'Сервер недоступен',
    uptime !== null ? `Uptime: ${formatUptime(uptime)}` : '',
    `Успех: ${successRate}%`,
  ].filter(Boolean).join(' | ');

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Glassmorphism header */}
      <header className="glass-panel flex shrink-0 items-center border-b px-6 py-3">
        <div className="flex-1" />

        <h1 className="text-sm font-semibold text-white">{title}</h1>

        <div className="flex flex-1 items-center justify-end gap-3">
          <span className="min-w-[2.8rem] text-center text-body tabular-nums text-gray-300">
            {time}
          </span>

          <div className="flex items-center gap-1 text-body text-gray-300">
            <Cloud className="h-3.5 w-3.5 text-gray-400" />
            {weather !== null ? (
              <span>{weather}</span>
            ) : (
              <span title="Задайте город в Настройках" className="text-gray-500">
                —°C
              </span>
            )}
          </div>

          <div title={serverTooltip} className="flex items-center gap-1.5 cursor-default">
            <span
              className={`h-2 w-2 rounded-full ${serverOnline ? 'status-online' : 'bg-red-500'}`}
            />
            <span className="text-caption text-gray-400">
              {serverOnline ? 'online' : 'offline'}
            </span>
          </div>

          <button
            onClick={() => router.push('/hub')}
            aria-label="Закрыть окно"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">{children}</div>

        {/* Glassmorphism right sidebar */}
        <aside className="glass-panel flex w-16 shrink-0 flex-col items-center gap-2 border-l py-4">
          {rightItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              onClick={() => console.log(label)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-200"
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}

          <div className="mt-auto">
            <button
              title="Выйти"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
