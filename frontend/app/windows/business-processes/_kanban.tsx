'use client';

import React, { useRef, useState, useEffect } from 'react';
import { API, authHeaders } from '@/lib/auth';

/* ── Exported types & constants ───────────────────────────────────────────── */

export interface KanbanCol { id: string; name: string; color: string; }

export const IS: React.CSSProperties = {
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

export const CARD_S: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.03)',
};

/* ── useEmployees hook ────────────────────────────────────────────────────── */

export interface Employee {
  id: string;
  full_name: string;
  branch_id?: string | null;
}

export function useEmployees(): Employee[] {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetch(`${API}/auth/employees`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setEmployees(data as Employee[]);
      })
      .catch(() => setEmployees([]));
  }, []);

  return employees;
}

/* ── FieldRow ─────────────────────────────────────────────────────────────── */

export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      {children}
    </div>
  );
}

/* ── BpModal ──────────────────────────────────────────────────────────────── */

export function BpModal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          maxWidth: wide ? 640 : 420,
          width: '100%',
          borderRadius: 20,
          padding: 24,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 18,
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── KanbanBoard ──────────────────────────────────────────────────────────── */

interface KanbanBoardProps<T extends { id: string; status: string }> {
  columns: KanbanCol[];
  items: T[];
  loading: boolean;
  apiError?: boolean;
  renderCard: (item: T) => React.ReactNode;
  onStatusChange: (item: T, newStatus: string) => void;
  onAddClick: (status: string) => void;
  toolbar?: React.ReactNode;
}

export function KanbanBoard<T extends { id: string; status: string }>({
  columns,
  items,
  loading,
  apiError,
  renderCard,
  onStatusChange,
  onAddClick,
  toolbar,
}: KanbanBoardProps<T>) {
  const draggingRef = useRef<T | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {toolbar && (
        <div
          style={{
            borderBottom: '1px solid var(--border)',
            padding: '10px 16px',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {toolbar}
        </div>
      )}

      {loading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          Загрузка...
        </div>
      ) : apiError ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
            textAlign: 'center',
            padding: 24,
          }}
        >
          API не подключён — таблица будет создана в Supabase
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            padding: '12px 16px',
            flex: 1,
            alignItems: 'flex-start',
          }}
        >
          {columns.map((col) => {
            const colItems = items.filter((i) => i.status === col.id);
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                style={{
                  width: 220,
                  minWidth: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  border: `2px solid ${isOver ? col.color : 'transparent'}`,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'border-color 150ms ease-out',
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.id);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => {
                  if (draggingRef.current && draggingRef.current.status !== col.id) {
                    onStatusChange(draggingRef.current, col.id);
                  }
                  draggingRef.current = null;
                  setDragOverCol(null);
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: col.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text)',
                      flex: 1,
                    }}
                  >
                    {col.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 10,
                      padding: '1px 7px',
                    }}
                  >
                    {colItems.length}
                  </span>
                </div>

                {/* Cards */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minHeight: 60,
                  }}
                >
                  {colItems.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        padding: '16px 0',
                      }}
                    >
                      Нет карточек
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => {
                          draggingRef.current = item;
                        }}
                        onDragEnd={() => {
                          draggingRef.current = null;
                        }}
                        style={{ cursor: 'grab' }}
                      >
                        {renderCard(item)}
                      </div>
                    ))
                  )}
                </div>

                {/* Add button */}
                <div style={{ padding: '6px 8px 10px' }}>
                  <button
                    onClick={() => onAddClick(col.id)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: '1px dashed var(--border)',
                      borderRadius: 8,
                      padding: '6px 0',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    + Добавить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
