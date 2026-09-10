'use client';

import { useState, useRef } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';

const SOUND_FILES = [
  'OK.mp3', '2toon.mp3', 'classic.mp3', 'crash.mp3', 'disck.mp3',
  'error.mp3', 'hw.mp3', 'old.mp3', 'old2.mp3', 'rim.mp3', 'steam.mp3', 'toon.mp3',
];

const SOUND_EVENTS = [
  { key: 'new_lead',              label: 'Новый лид',                          desc: 'При добавлении нового лида' },
  { key: 'new_task',              label: 'Новая задача',                        desc: 'При создании задачи' },
  { key: 'task_assigned',         label: 'Назначена задача',                    desc: 'Когда назначают задачу вам' },
  { key: 'booking_created',       label: 'Бронь создана',                       desc: 'При создании записи на сеанс' },
  { key: 'booking_confirmed',     label: 'Бронь подтверждена',                  desc: 'Когда бронь подтверждена' },
  { key: 'booking_pending',       label: 'Бронь ожидает подтверждения',         desc: 'Клиент записался через портал' },
  { key: 'booking_cancelled',     label: 'Бронь отменена',                      desc: 'При отмене бронирования' },
  { key: 'subscription_sold',     label: 'Абонемент продан',                    desc: 'При продаже абонемента' },
  { key: 'subscription_expiring', label: 'Абонемент истекает',                  desc: 'За 7 дней до окончания' },
  { key: 'shift_replacement',     label: 'Замена на смене',                     desc: 'При назначении замены' },
  { key: 'new_client',            label: 'Новый клиент',                        desc: 'При добавлении нового клиента' },
  { key: 'payment_received',      label: 'Оплата получена',                     desc: 'При подтверждении оплаты' },
];

interface NotifSettings {
  muted: boolean;
  volume: number;
  events: Record<string, string>;
}

function loadSettings(): NotifSettings {
  try {
    return { muted: false, volume: 80, events: {}, ...JSON.parse(localStorage.getItem('notificationSettings') ?? '{}') };
  } catch {
    return { muted: false, volume: 80, events: {} };
  }
}

export default function SoundsPage() {
  const [s, setS]               = useState<NotifSettings>(loadSettings);
  const audioRef                = useRef<HTMLAudioElement | null>(null);
  const [pushEnabled, setPushEnabled] = useState(() =>
    typeof window !== 'undefined' && Notification?.permission === 'granted',
  );
  const pushSupported = typeof window !== 'undefined' && 'Notification' in window;

  const save = (patch: Partial<NotifSettings>) => {
    const next = { ...s, ...patch };
    setS(next);
    localStorage.setItem('notificationSettings', JSON.stringify(next));
  };

  const preview = (file: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const a = new Audio('/sound/' + file);
    a.volume = s.volume / 100;
    a.play().catch(() => {});
    audioRef.current = a;
  };

  return (
    <div className="p-6 max-w-xl space-y-6">
      <h2 className="text-subheading text-white">Звуки и уведомления</h2>

      {/* Mute toggle */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {s.muted
              ? <VolumeX className="h-5 w-5 text-gray-500" />
              : <Volume2 className="h-5 w-5 text-teal" />
            }
            <span className="text-body text-gray-200">
              {s.muted ? 'Без звука' : 'Звук включён'}
            </span>
          </div>
          <button
            onClick={() => save({ muted: !s.muted })}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              position: 'relative', background: s.muted ? 'rgba(255,255,255,0.12)' : 'var(--color-success)',
              transition: 'background 200ms ease-out',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
              background: '#fff', transition: 'left 200ms ease-out',
              left: s.muted ? 2 : 22,
            }} />
          </button>
        </div>

        {/* Volume */}
        <div className="mt-5">
          <div className="mb-2 flex justify-between">
            <span className="text-caption text-gray-400">Громкость</span>
            <span className="text-caption font-semibold text-teal">{s.volume}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={s.volume}
            onChange={(e) => save({ volume: +e.target.value })}
            disabled={s.muted}
            style={{ width: '100%', accentColor: '#02BDB6', cursor: s.muted ? 'not-allowed' : 'pointer' }}
          />
        </div>
      </div>

      {/* Push notifications */}
      {pushSupported && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body text-gray-200">Push-уведомления браузера</p>
              <p className="mt-0.5 text-caption text-gray-500">
                {Notification.permission === 'denied'
                  ? 'Заблокировано в настройках браузера'
                  : pushEnabled ? 'Включены' : 'Выключены'}
              </p>
            </div>
            <button
              disabled={Notification.permission === 'denied'}
              onClick={async () => {
                if (!pushEnabled) {
                  const perm = await Notification.requestPermission();
                  setPushEnabled(perm === 'granted');
                } else {
                  setPushEnabled(false);
                }
              }}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none',
                cursor: Notification.permission === 'denied' ? 'not-allowed' : 'pointer',
                position: 'relative',
                background: pushEnabled ? 'var(--color-success)' : 'rgba(255,255,255,0.12)',
                transition: 'background 200ms ease-out',
                opacity: Notification.permission === 'denied' ? 0.4 : 1,
              }}
            >
              <span style={{
                position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
                background: '#fff', transition: 'left 200ms ease-out',
                left: pushEnabled ? 22 : 2,
              }} />
            </button>
          </div>
        </div>
      )}

      {/* Event → Sound mapping */}
      <div className="glass rounded-2xl p-5">
        <p className="mb-4 text-caption font-semibold uppercase tracking-wider text-gray-500">
          Событие → Звук
        </p>
        <div className="flex flex-col divide-y divide-white/5">
          {SOUND_EVENTS.map((ev) => {
            const cur = s.events[ev.key] ?? 'OK.mp3';
            return (
              <div key={ev.key} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-body text-gray-200">{ev.label}</p>
                  <p className="text-caption text-gray-500">{ev.desc}</p>
                </div>
                <select
                  value={cur}
                  onChange={(e) => save({ events: { ...s.events, [ev.key]: e.target.value } })}
                  className="glass rounded-lg px-2 py-1.5 text-caption text-gray-300 outline-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {SOUND_FILES.map((f) => (
                    <option key={f} value={f}>{f.replace('.mp3', '')}</option>
                  ))}
                </select>
                <button
                  onClick={() => preview(cur)}
                  disabled={s.muted}
                  title="Прослушать"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-teal transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
