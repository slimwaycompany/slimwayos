import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TimetableView from './TimetableView'
import ScheduleBookingsPage from './ScheduleBookingsPage'

const TABS = [
  { key: 'timetable', label: 'Расписание', path: '/schedule' },
  { key: 'shifts',    label: 'График дежурств', path: '/schedule/shifts' },
  { key: 'bookings',  label: 'Записи',           path: '/schedule/bookings' },
]

export default function SchedulePage() {
  const { pathname } = useLocation()
  const navigate    = useNavigate()

  const active = pathname.startsWith('/schedule/shifts')
    ? 'shifts'
    : pathname.startsWith('/schedule/bookings')
      ? 'bookings'
      : 'timetable'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              height: 44,
              padding: '0 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              borderBottom: active === tab.key
                ? '2px solid var(--accent)'
                : '2px solid transparent',
              color: active === tab.key ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 150ms ease-out, border-color 150ms ease-out',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {active === 'timetable' && <TimetableView />}
        {active === 'shifts'    && <ShiftsPlaceholder />}
        {active === 'bookings'  && <ScheduleBookingsPage />}
      </div>
    </div>
  )
}

function ShiftsPlaceholder() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 14 }}>
      График дежурств
    </div>
  )
}
