'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API, authHeaders } from '@/lib/auth';
import {
  KanbanBoard,
  KanbanCol,
  BpModal,
  IS,
  CARD_S,
  FieldRow,
} from './_kanban';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface ChecklistSection {
  checks: boolean[];
  comment: string;
}

interface ChecklistItems {
  [key: string]: ChecklistSection;
}

interface BpChecklist {
  id: string;
  status: string;
  checklist_date?: string;
  shift_info?: string;
  items?: ChecklistItems;
  created_at: string;
}

/* ── Columns ──────────────────────────────────────────────────────────────── */

const CHECKLIST_COLS: KanbanCol[] = [
  { id: 'new',      name: 'Новые',             color: 'var(--color-info)' },
  { id: 'revision', name: 'Требуют доработки', color: 'var(--color-warning)' },
  { id: 'closed',   name: 'Закрытые',          color: 'var(--color-success)' },
];

/* ── Checklist definitions ────────────────────────────────────────────────── */

const CHECKLIST_DEFS = [
  {
    key: 'vacuactiv',
    title: 'VacuActiv (3 шт.)',
    hasComment: true,
    commentPlaceholder: 'Если проблема — указать № аппарата 1/2/3',
    items: [
      'Полотно дорожки ровное, без бугров/складок/волн',
      'Полотно не съезжает в сторону при работе',
      'Нет посторонних звуков при движении полотна',
      'Насос/компрессор работает без посторонних шумов',
      'Манжеты/капсула плотно прилегают, нет утечки давления',
      'ИК-элементы греют равномерно',
      'Дверь/стекло капсулы закрывается плотно',
      'Экран и пульт управления работают исправно',
      'Провода и кабели целые, без повреждений',
      'Чистота внутри и снаружи',
    ],
  },
  {
    key: 'infrashape',
    title: 'InfraShape (1 шт.)',
    hasComment: true,
    commentPlaceholder: 'Комментарий',
    items: [
      'Педали крутятся плавно, без заеданий и посторонних звуков',
      'Вакуумная манжета/капсула плотно прилегает, нет утечки давления',
      'ИК-элементы греют равномерно',
      'Экран и пульт управления работают исправно',
      'Провода и кабели целые',
      'Чистота',
    ],
  },
  {
    key: 'infrastep',
    title: 'InfraStep (1 шт.)',
    hasComment: true,
    commentPlaceholder: 'Комментарий',
    items: [
      'Педали/степ-платформа без люфта и посторонних звуков',
      'ИК-элементы работают, греют равномерно',
      'Экран и пульт управления исправны',
      'Чистота',
    ],
  },
  {
    key: 'rollshape',
    title: 'RollShape (4 шт.)',
    hasComment: true,
    commentPlaceholder: 'Если проблема — указать № аппарата 1–4',
    items: [
      'Ролики вращаются плавно во всех аппаратах, без заеданий и звуков',
      'Нет повреждений на валиках/поверхности',
      'Экраны и пульты управления работают',
      'Чистота',
    ],
  },
  {
    key: 'inbody',
    title: 'InBody 270 (1 шт.)',
    hasComment: true,
    commentPlaceholder: 'Комментарий',
    items: [
      'Включается и проходит калибровку без ошибок',
      'Электроды чистые, без повреждений',
      'Экран/печать результатов работает корректно',
    ],
  },
  {
    key: 'entrance',
    title: 'Вход и безопасность',
    hasComment: false,
    commentPlaceholder: '',
    items: [
      'Окна и двери — целые, чистые',
      'Вывеска работает',
      'Охранная сигнализация работает',
      'Доводчик двери работает',
      'Магнитные замки работают',
      'Свет — весь работает (зал, раздевалка, санузел)',
    ],
  },
  {
    key: 'salesfloor',
    title: 'Торговый зал',
    hasComment: false,
    commentPlaceholder: '',
    items: [
      'Полы и стены чистые',
      'Рабочее место сотрудника в порядке',
      'Визитки и промо-материалы — есть, актуальные',
    ],
  },
  {
    key: 'it',
    title: 'ИТ-оборудование и расходники',
    hasComment: false,
    commentPlaceholder: '',
    items: [
      'Телефон, терминал Kaspi, ноутбуки работают',
      'Расходники: бумага, мусорные пакеты — в наличии',
    ],
  },
  {
    key: 'cleaning',
    title: 'Клининг',
    hasComment: false,
    commentPlaceholder: '',
    items: [
      'Станция уборки готова: Дезо С9, салфетки, укладка',
      'Распылитель для обработки капсул/оборудования готов',
    ],
  },
  {
    key: 'locker',
    title: 'Раздевалка / душ / санузел',
    hasComment: false,
    commentPlaceholder: '',
    items: [
      'Душ чистый, работает',
      'Фен в раздевалке работает',
      'Расходники раздевалки: ушные палочки, резинки — в наличии',
      'Расходники душевой/санузла — в наличии',
      'Туалетная бумага в наличии',
      'Мыло в наличии',
      'Освежитель (разбрызгиватель) в наличии, работает',
    ],
  },
  {
    key: 'coffee',
    title: 'Кофе-зона',
    hasComment: false,
    commentPlaceholder: '',
    items: [
      'Кофе в наличии',
      'Стаканчики для кофе, воды',
      'Кофемашина работает',
      'Холодильник работает',
      'Пурифайер работает',
    ],
  },
  {
    key: 'ac',
    title: 'Кондиционеры',
    hasComment: false,
    commentPlaceholder: '',
    items: [
      'Работают (все блоки)',
      'Пульты работают',
    ],
  },
];

/* ── Card ─────────────────────────────────────────────────────────────────── */

function ChecklistCard({ item }: { item: BpChecklist }) {
  let done = 0;
  let total = 0;
  if (item.items) {
    for (const key of Object.keys(item.items)) {
      const section = item.items[key];
      if (section && Array.isArray(section.checks)) {
        total += section.checks.length;
        done += section.checks.filter(Boolean).length;
      }
    }
  }

  return (
    <div style={CARD_S}>
      {item.checklist_date && (
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
          {item.checklist_date}
        </div>
      )}
      {item.shift_info && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          {item.shift_info}
        </div>
      )}
      {total > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {done} / {total} пунктов выполнено
        </div>
      )}
    </div>
  );
}

/* ── Build initial items state ────────────────────────────────────────────── */

function buildInitialItems(): ChecklistItems {
  const result: ChecklistItems = {};
  for (const def of CHECKLIST_DEFS) {
    result[def.key] = {
      checks: def.items.map(() => false),
      comment: '',
    };
  }
  return result;
}

/* ── Create Modal ─────────────────────────────────────────────────────────── */

function CreateChecklistModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [checklistDate, setChecklistDate] = useState(today);
  const [shiftInfo, setShiftInfo] = useState('');
  const [items, setItems] = useState<ChecklistItems>(buildInitialItems);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const toggleSection = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleCheck = (sectionKey: string, idx: number) => {
    setItems((prev) => {
      const section = prev[sectionKey];
      if (!section) return prev;
      const newChecks = [...section.checks];
      newChecks[idx] = !newChecks[idx];
      return { ...prev, [sectionKey]: { ...section, checks: newChecks } };
    });
  };

  const setComment = (sectionKey: string, value: string) => {
    setItems((prev) => {
      const section = prev[sectionKey];
      if (!section) return prev;
      return { ...prev, [sectionKey]: { ...section, comment: value } };
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/business-processes/checklist`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist_date: checklistDate,
          shift_info: shiftInfo,
          items,
        }),
      });
      onCreated();
      onClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <BpModal title="Новый чек-лист филиала" onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <FieldRow label="Дата">
            <input
              style={{ ...IS, width: 140 }}
              type="date"
              value={checklistDate}
              onChange={(e) => setChecklistDate(e.target.value)}
            />
          </FieldRow>
          <FieldRow label="Информация о смене">
            <input
              style={IS}
              value={shiftInfo}
              onChange={(e) => setShiftInfo(e.target.value)}
              placeholder="Напр.: Утренняя, Сотрудник"
            />
          </FieldRow>
        </div>

        {CHECKLIST_DEFS.map((def) => {
          const section = items[def.key];
          const isCollapsed = !!collapsed[def.key];
          const checkedCount = section ? section.checks.filter(Boolean).length : 0;
          const totalCount = def.items.length;

          return (
            <div
              key={def.key}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              {/* Section header */}
              <button
                onClick={() => toggleSection(def.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                <span>{def.title}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color:
                        checkedCount === totalCount
                          ? 'var(--color-success)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {checkedCount}/{totalCount}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 150ms ease-out',
                      display: 'inline-block',
                    }}
                  >
                    ▾
                  </span>
                </span>
              </button>

              {/* Section body */}
              {!isCollapsed && section && (
                <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {def.items.map((itemLabel, idx) => (
                    <label
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--text)',
                        lineHeight: 1.4,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={section.checks[idx] ?? false}
                        onChange={() => toggleCheck(def.key, idx)}
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      {itemLabel}
                    </label>
                  ))}
                  {def.hasComment && (
                    <textarea
                      style={{ ...IS, marginTop: 4, minHeight: 50, resize: 'vertical' }}
                      placeholder={def.commentPlaceholder}
                      value={section.comment}
                      onChange={(e) => setComment(def.key, e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            marginTop: 8,
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            border: 'none',
            borderRadius: 10,
            padding: '10px 0',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          Сохранить чек-лист
        </button>
      </div>
    </BpModal>
  );
}

/* ── ChecklistBoard ───────────────────────────────────────────────────────── */

export default function ChecklistBoard() {
  const [items, setItems] = useState<BpChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [createModal, setCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/business-processes/checklist`, {
        headers: authHeaders(),
      });
      if (!res.ok) { setApiError(true); setItems([]); return; }
      const data: unknown = await res.json();
      setItems(Array.isArray(data) ? (data as BpChecklist[]) : []);
      setApiError(false);
    } catch {
      setApiError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (item: BpChecklist, newStatus: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)),
    );
    try {
      await fetch(`${API}/business-processes/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)),
      );
    }
  };

  const toolbar = (
    <>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
        Чек-лист филиала
      </span>
      <button
        onClick={() => setCreateModal(true)}
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-fg)',
          border: 'none',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Новый чек-лист
      </button>
    </>
  );

  return (
    <>
      <KanbanBoard<BpChecklist>
        columns={CHECKLIST_COLS}
        items={items}
        loading={loading}
        apiError={apiError}
        renderCard={(item) => <ChecklistCard item={item} />}
        onStatusChange={handleStatusChange}
        onAddClick={() => setCreateModal(true)}
        toolbar={toolbar}
      />
      {createModal && (
        <CreateChecklistModal onClose={() => setCreateModal(false)} onCreated={load} />
      )}
    </>
  );
}
