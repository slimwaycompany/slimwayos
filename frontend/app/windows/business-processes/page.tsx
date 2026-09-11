'use client';

import React, { useState } from 'react';
import AttendanceBoard from './_attendance';
import ZrsBoard from './_zrs';
import SuppliesBoard from './_supplies';
import ShiftOpenBoard from './_shift-open';
import ShiftCloseBoard from './_shift-close';
import ChecklistBoard from './_checklist';

const PROCESSES = [
  { id: 'attendance',   label: 'Отметка на смене' },
  { id: 'zrs',          label: 'ЗРС' },
  { id: 'supplies',     label: 'Заявка на расходники' },
  { id: 'shift_open',   label: 'Открытие смены' },
  { id: 'shift_close',  label: 'Сдача смены' },
  { id: 'checklist',    label: 'Чек-лист филиала' },
] as const;

type ProcessId = (typeof PROCESSES)[number]['id'];

export default function BusinessProcessesPage() {
  const [active, setActive] = useState<ProcessId>('attendance');

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div
        style={{
          width: 180,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
        }}
      >
        {PROCESSES.map((p) => {
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              style={{
                background: isActive
                  ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                  : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 150ms ease-out, color 150ms ease-out',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Board area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {active === 'attendance'  && <AttendanceBoard />}
        {active === 'zrs'         && <ZrsBoard />}
        {active === 'supplies'    && <SuppliesBoard />}
        {active === 'shift_open'  && <ShiftOpenBoard />}
        {active === 'shift_close' && <ShiftCloseBoard />}
        {active === 'checklist'   && <ChecklistBoard />}
      </div>
    </div>
  );
}
