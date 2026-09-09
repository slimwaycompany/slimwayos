'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, Megaphone, CalendarDays, Newspaper, Star, Cake } from 'lucide-react';
import { API, authHeaders } from '@/lib/auth';

interface DashBlock<T> {
  data: T | null;
  loading: boolean;
}

function useDash<T>(endpoint: string): DashBlock<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}/dashboard/${endpoint}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [endpoint]);
  return { data, loading };
}

function Card({
  icon: Icon,
  title,
  children,
  accent = '#02BDB6',
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${accent}1a`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-caption font-semibold uppercase tracking-wider text-gray-400">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Skeleton() {
  return <div className="h-8 w-24 animate-pulse rounded-lg bg-white/5" />;
}

function BigNumber({ value, label }: { value: string | number; label?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-subheading font-bold text-gray-100">{value}</span>
      {label && <span className="text-caption text-gray-500">{label}</span>}
    </div>
  );
}

export default function HomePage() {
  const memberships = useDash<{ count: number }>('active-memberships');
  const sales = useDash<{ total: number; plan: number; percent: number | null }>('sales-summary');
  const marketing = useDash<{ leads: number; converted: number; conversion: number }>('marketing-summary');
  const events = useDash<any[]>('upcoming-events');
  const news = useDash<any[]>('news');
  const topSeller = useDash<{ name: string; total: number } | null>('top-seller');
  const birthdays = useDash<any[]>('birthdays');

  return (
    <div className="p-6">
      <h2 className="mb-6 text-subheading text-white">Главная</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active memberships */}
        <Card icon={Users} title="Активные абонементы">
          {memberships.loading ? (
            <Skeleton />
          ) : (
            <BigNumber value={memberships.data?.count ?? 0} label="сегодня активны" />
          )}
        </Card>

        {/* Sales summary */}
        <Card icon={TrendingUp} title="Продажи за месяц">
          {sales.loading ? (
            <Skeleton />
          ) : (
            <div className="flex flex-col gap-1">
              <BigNumber
                value={`${(sales.data?.total ?? 0).toLocaleString('ru')} ₽`}
              />
              {(sales.data?.plan ?? 0) > 0 && (
                <>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(sales.data!.percent ?? 0, 100)}%`,
                        background: (sales.data?.percent ?? 0) >= 100 ? '#10B981' : '#02BDB6',
                      }}
                    />
                  </div>
                  <span className="text-caption text-gray-500">
                    {sales.data?.percent ?? 0}% от плана ({(sales.data?.plan ?? 0).toLocaleString('ru')} ₽)
                  </span>
                </>
              )}
              {(sales.data?.plan ?? 0) === 0 && (
                <span className="text-caption text-gray-600">план не задан</span>
              )}
            </div>
          )}
        </Card>

        {/* Marketing summary */}
        <Card icon={Megaphone} title="Маркетинг за месяц">
          {marketing.loading ? (
            <Skeleton />
          ) : (
            <div className="flex gap-6">
              <BigNumber value={marketing.data?.leads ?? 0} label="лидов" />
              <BigNumber
                value={`${marketing.data?.conversion ?? 0}%`}
                label="конверсия"
              />
            </div>
          )}
        </Card>

        {/* Upcoming events */}
        <Card icon={CalendarDays} title="Ближайшие события">
          {events.loading ? (
            <Skeleton />
          ) : !events.data?.length ? (
            <span className="text-body text-gray-600">Нет запланированных событий</span>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {events.data.slice(0, 5).map((ev: any, i: number) => (
                <li key={ev.id ?? i} className="flex items-center justify-between gap-2">
                  <span className="truncate text-body text-gray-200">{ev.title}</span>
                  <span className="shrink-0 text-caption text-gray-500">
                    {ev.date} {ev.start_time ?? ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* News */}
        <Card icon={Newspaper} title="Новости">
          {news.loading ? (
            <Skeleton />
          ) : !news.data?.length ? (
            <span className="text-body text-gray-600">Нет новостей</span>
          ) : (
            <ul className="flex flex-col gap-2">
              {news.data.map((post: any, i: number) => (
                <li key={post.id ?? i} className="flex flex-col gap-0.5 border-b border-white/5 pb-2 last:border-0">
                  <span className="text-body font-medium text-gray-200">{post.title}</span>
                  <span className="text-caption text-gray-500 line-clamp-1">{post.content}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Top seller */}
        <Card icon={Star} title="Лучший продавец месяца" accent="#F59E0B">
          {topSeller.loading ? (
            <Skeleton />
          ) : !topSeller.data ? (
            <span className="text-body text-gray-600">Нет данных о продажах</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-subheading font-bold text-gray-100">{topSeller.data.name}</span>
              <span className="text-body text-gray-500">
                {topSeller.data.total.toLocaleString('ru')} ₽
              </span>
            </div>
          )}
        </Card>

        {/* Birthdays */}
        <Card icon={Cake} title="Дни рождения на этой неделе" accent="#A78BFA">
          {birthdays.loading ? (
            <Skeleton />
          ) : !birthdays.data?.length ? (
            <span className="text-body text-gray-600">Именинников нет</span>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {birthdays.data.map((p: any, i: number) => (
                <li key={p.id ?? i} className="flex items-center justify-between gap-2">
                  <span className="text-body text-gray-200">
                    {p.first_name} {p.last_name}
                  </span>
                  <span className="shrink-0 text-caption text-gray-500">
                    {p.days_until === 0 ? 'сегодня 🎂' : `через ${p.days_until} дн.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
