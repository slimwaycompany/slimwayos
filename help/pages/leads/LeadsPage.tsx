import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, X, MessageCircle, Phone, User, AlertCircle,
  ChevronRight, Trash2, Edit2, Check,
  UserPlus, Download, Clock, ArrowRight,
  Settings, ChevronDown, LayoutGrid, List,
  BarChart2, GripVertical,
} from 'lucide-react'
import { leadsApi } from '../../api/leads.api'
import { leadFunnelsApi } from '../../api/leadFunnels.api'
import { leadFunnelColumnsApi } from '../../api/leadFunnelColumns.api'
import { failReasonsApi } from '../../api/failReasons.api'
import { clientPipelineApi } from '../../api/clientPipeline.api'
import { employeesApi } from '../../api/employees.api'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { playSound } from '../../lib/notify'
import { ContextMenu, type ContextMenuEntry } from '../../components/ContextMenu'
import { PeriodFilter } from '../../components/ui/PeriodFilter'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import type {
  Lead, LeadStatus, LeadComment, Employee, ClientPipeline, ClientPipelineStatus, LostClient,
  LeadFunnel, LeadFunnelColumn, FailReason,
} from '../../types'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Constants ───────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  manual:         'Вручную',
  whatsapp:       'WhatsApp',
  instagram:      'Instagram',
  tiktok:         'TikTok',
  site:           'Сайт',
  tilda:          'Tilda',
  recommendation: 'Рекомендация',
  call:           'Обзвон',
  other:          'Другое',
}

const LEAD_SOURCES = [
  { value: 'instagram',      label: 'Instagram' },
  { value: 'tiktok',         label: 'TikTok' },
  { value: 'site',           label: 'Сайт' },
  { value: 'tilda',          label: 'Tilda' },
  { value: 'recommendation', label: 'Рекомендация' },
  { value: 'call',           label: 'Обзвон' },
  { value: 'whatsapp',       label: 'WhatsApp' },
  { value: 'manual',         label: 'Вручную' },
  { value: 'other',          label: 'Другое' },
]

const PIPELINE_COLUMNS: { id: ClientPipelineStatus; label: string; color: string }[] = [
  { id: 'new_client',    label: 'Новый клиент',   color: 'var(--color-info)' },
  { id: 'active',        label: 'Активный',       color: 'var(--color-success)' },
  { id: 'frozen',        label: 'Заморожен',      color: 'var(--text-muted)' },
  { id: 'expiring_soon', label: 'Истекает скоро', color: 'var(--color-warning)' },
  { id: 'not_renewed',   label: 'Не продлил',     color: 'var(--color-danger)' },
]

type LeadsTab = 'leads' | 'pipeline' | 'lost'
type SortField = 'full_name' | 'created_at' | 'days'

function daysInStage(statusChangedAt: string | null | undefined, createdAt: string): number {
  const base = statusChangedAt ?? createdAt
  return Math.floor((Date.now() - new Date(base).getTime()) / (1000 * 60 * 60 * 24))
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 36, padding: '0 12px',
  background: 'transparent', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 150ms ease-out',
}
const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  resize: 'vertical', lineHeight: 1.5,
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, display: 'block',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLeadColumnId(lead: Lead, columns: LeadFunnelColumn[]): string | null {
  if (lead.funnel_column_id) return lead.funnel_column_id
  const col = columns.find(c => c.status_key === lead.status)
  return col?.id ?? null
}

// ─── StatusBar ───────────────────────────────────────────────────────────────

interface StatusBarProps {
  current: string
  columns: LeadFunnelColumn[]
  moving: string | null
  onChange: (colId: string, col: LeadFunnelColumn) => void
}

function StatusBar({ current, columns, moving, onChange }: StatusBarProps) {
  const currentColId = current
  return (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
      {columns.map((col, i) => {
        const isActive = currentColId === col.id
        const isMoving = moving === col.id
        return (
          <React.Fragment key={col.id}>
            {i > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border)', flexShrink: 0 }}>
                <ArrowRight size={10} />
              </div>
            )}
            <button
              onClick={() => { if (!moving) onChange(col.id, col) }}
              disabled={moving !== null}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 28, padding: '0 10px', borderRadius: 20,
                border: isActive ? `1px solid color-mix(in srgb, ${col.color} 50%, transparent)` : '1px solid var(--border)',
                background: isActive ? `color-mix(in srgb, ${col.color} 15%, transparent)` : 'transparent',
                color: isActive ? col.color : 'var(--text-muted)',
                fontSize: 11, fontWeight: isActive ? 600 : 400,
                cursor: moving !== null ? 'not-allowed' : 'pointer',
                opacity: moving !== null && !isActive ? 0.45 : 1,
                transition: 'background 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: col.color, flexShrink: 0 }} />}
              {col.name}
              {isMoving && <span style={{ fontSize: 10 }}>...</span>}
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── CreateLeadModal ──────────────────────────────────────────────────────────

interface CreateLeadModalProps {
  initialColumnId?: string | null
  employees: Employee[]
  onClose: () => void
  onCreate: (lead: Lead) => void
}

function CreateLeadModal({ initialColumnId, employees, onClose, onCreate }: CreateLeadModalProps) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [notes, setNotes]       = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [source, setSource]     = useState('manual')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleCreate = async () => {
    if (!fullName.trim()) { setError('Введите имя'); return }
    setSaving(true); setError(null)
    try {
      const lead = await leadsApi.create({ full_name: fullName.trim(), phone: phone.trim() || undefined, notes: notes.trim() || undefined, assigned_to: assignedTo || undefined, source: source as Lead['source'] })
      // If created in a specific funnel column, update it
      if (initialColumnId && lead.funnel_column_id !== initialColumnId) {
        const updated = await leadsApi.update(lead.id, { funnel_column_id: initialColumnId })
        onCreate(updated)
      } else {
        onCreate(lead)
      }
    } catch {
      setError('Не удалось создать лид')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Новый лид</div>
          <button onClick={onClose} className="icon-btn"><X size={16} /></button>
        </div>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--color-danger)' }}>
            <AlertCircle size={13} />{error}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Имя *</label>
            <input style={inputStyle} placeholder="Имя клиента" value={fullName} onChange={e => setFullName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Телефон</label>
            <input style={inputStyle} placeholder="+7 ..." value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Источник</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={source} onChange={e => setSource(e.target.value)}>
                {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ответственный</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="">Не назначен</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Заметки</label>
            <textarea style={textareaStyle} placeholder="Комментарий..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button onClick={() => void handleCreate()} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
            {saving ? 'Создание...' : 'Создать'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ─── FailReasonModal ──────────────────────────────────────────────────────────

interface FailReasonModalProps {
  failReasons: FailReason[]
  onConfirm: (reason: string) => void
  onClose: () => void
}

function FailReasonModal({ failReasons, onConfirm, onClose }: FailReasonModalProps) {
  const [selected, setSelected] = useState<string>(failReasons[0]?.name ?? '')
  const [custom, setCustom]     = useState('')
  const useCustom = failReasons.length === 0

  const handleConfirm = () => {
    const reason = useCustom ? custom.trim() : selected
    if (!reason) return
    onConfirm(reason)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 420, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Причина отказа</div>
          <button onClick={onClose} className="icon-btn"><X size={16} /></button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Укажите причину, по которой лид не был успешно закрыт.
        </div>
        {useCustom ? (
          <textarea
            style={textareaStyle}
            placeholder="Например: не дозвонились, передумал, не подошла цена..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            rows={4}
            autoFocus
          />
        ) : (
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={selected} onChange={e => setSelected(e.target.value)} autoFocus>
            {failReasons.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={handleConfirm}
            disabled={useCustom ? !custom.trim() : !selected}
            className="btn btn-danger"
            style={{ flex: 1 }}
          >
            Подтвердить отказ
          </button>
          <button onClick={onClose} className="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ─── ClientAddedModal ─────────────────────────────────────────────────────────

interface ClientAddedModalProps {
  clientId: string | null
  clientName: string | null
  onGoToClient: () => void
  onClose: () => void
}

function ClientAddedModal({ clientId, clientName, onGoToClient, onClose }: ClientAddedModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'color-mix(in srgb, var(--color-success) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <UserPlus size={22} color="var(--color-success)" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.01em' }}>Лид успешно закрыт!</div>
        {clientName ? (
          <>
            <div style={{ marginBottom: 16, padding: '10px 12px', background: 'color-mix(in srgb, var(--color-success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 20%, transparent)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>Создана карточка клиента</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-success)' }}>{clientName}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>Статус «Черновик». Перейдите в карточку для заполнения данных.</div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>Статус лида обновлён.</div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          {clientId && (
            <button onClick={onGoToClient} className="btn btn-primary" style={{ flex: 1, background: 'var(--color-success)' }}>Перейти к клиенту</button>
          )}
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: clientId ? undefined : 1 }}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}

// ─── LeadModal ────────────────────────────────────────────────────────────────

interface LeadModalProps {
  lead: Lead
  columns: LeadFunnelColumn[]
  employees: Employee[]
  failReasons: FailReason[]
  onClose: () => void
  onUpdate: (lead: Lead) => void
  onDelete: (id: string) => void
}

function LeadModal({ lead, columns, employees, failReasons, onClose, onUpdate, onDelete }: LeadModalProps) {
  const navigate  = useNavigate()
  const [detail, setDetail]       = useState<Lead>(lead)
  const [activeTab, setActiveTab] = useState<'info' | 'comments'>('info')
  const [comments, setComments]   = useState<LeadComment[]>(lead.lead_comments ?? [])
  const [commentText, setCommentText] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [editing, setEditing]     = useState(false)
  const [editName, setEditName]   = useState(lead.full_name)
  const [editPhone, setEditPhone] = useState(lead.phone ?? '')
  const [editNotes, setEditNotes] = useState(lead.notes ?? '')
  const [editAssigned, setEditAssigned] = useState(
    () => employees.find(e => e.profile_id === lead.assigned_to)?.id ?? lead.assigned_to ?? ''
  )
  const [saving, setSaving]       = useState(false)
  const [movingTo, setMovingTo]   = useState<string | null>(null)
  const [showClientAdded, setShowClientAdded] = useState<{ id: string | null; full_name: string | null; phone: string | null } | null>(null)
  const [failReasonPending, setFailReasonPending] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    leadsApi.getById(lead.id)
      .then(d => { setDetail(d); setComments(d.lead_comments ?? []) })
      .catch(() => {})
  }, [lead.id])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const currentColId = detail.funnel_column_id
    ?? columns.find(c => c.status_key === detail.status)?.id
    ?? null

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await leadsApi.update(detail.id, {
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        notes: editNotes.trim() || null,
        assigned_to: editAssigned || null,
      })
      setDetail(updated); onUpdate(updated); setEditing(false)
    } catch { /* */ } finally { setSaving(false) }
  }

  const handleColChange = async (colId: string, col: LeadFunnelColumn) => {
    if (col.status_key === 'fail') {
      setFailReasonPending(true)
      return
    }
    setMovingTo(colId)
    try {
      let result: { lead: Lead; client: { id: string; full_name: string; phone: string | null } | null }
      if (col.status_key) {
        result = await leadsApi.updateStatus(detail.id, col.status_key as LeadStatus, undefined)
        await leadsApi.update(detail.id, { funnel_column_id: colId })
        result.lead.funnel_column_id = colId
      } else {
        const updated = await leadsApi.update(detail.id, { funnel_column_id: colId })
        result = { lead: updated, client: null }
      }
      setDetail(result.lead); onUpdate(result.lead)
      if (col.status_key === 'success') {
        setShowClientAdded(result.client ? { id: result.client.id, full_name: result.client.full_name, phone: result.client.phone } : { id: null, full_name: null, phone: null })
      }
    } catch { /* */ } finally { setMovingTo(null) }
  }

  const handleFailConfirm = async (reason: string) => {
    setFailReasonPending(false)
    const failCol = columns.find(c => c.status_key === 'fail')
    setMovingTo(failCol?.id ?? 'fail')
    try {
      const result = await leadsApi.updateStatus(detail.id, 'fail', reason)
      if (failCol) {
        await leadsApi.update(detail.id, { funnel_column_id: failCol.id })
        result.lead.funnel_column_id = failCol.id
      }
      setDetail(result.lead); onUpdate(result.lead)
    } catch { /* */ } finally { setMovingTo(null) }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    setAddingComment(true)
    try {
      const c = await leadsApi.addComment(detail.id, commentText.trim())
      setComments(prev => [...prev, c]); setCommentText('')
    } catch { /* */ } finally { setAddingComment(false) }
  }

  const assignedEmp = employees.find(e => e.profile_id === detail.assigned_to)
    ?? employees.find(e => e.id === detail.assigned_to)

  return (
    <>
      {failReasonPending && (
        <FailReasonModal failReasons={failReasons} onConfirm={handleFailConfirm} onClose={() => setFailReasonPending(false)} />
      )}
      {showClientAdded !== null && (
        <ClientAddedModal
          clientId={showClientAdded.id}
          clientName={showClientAdded.full_name}
          onGoToClient={() => { const cid = showClientAdded.id; setShowClientAdded(null); if (cid) navigate(`/clients/${cid}`) }}
          onClose={() => setShowClientAdded(null)}
        />
      )}
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
        <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 680, maxHeight: '90vh', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editing ? (
                  <input style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 4 }}>{detail.full_name}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {detail.phone && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{detail.phone}</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{SOURCE_LABELS[detail.source] ?? detail.source}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                {editing ? (
                  <button onClick={() => void handleSave()} disabled={saving} className="icon-btn" style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)' }}>
                    <Check size={14} />
                  </button>
                ) : (
                  <button onClick={() => setEditing(true)} className="icon-btn"><Edit2 size={14} /></button>
                )}
                <button onClick={() => { if (confirm('Удалить лид?')) { onDelete(detail.id) } }} className="icon-btn" style={{ color: 'var(--color-danger)' }}>
                  <Trash2 size={14} />
                </button>
                <button onClick={onClose} className="icon-btn"><X size={14} /></button>
              </div>
            </div>
            <div style={{ paddingBottom: 14 }}>
              {columns.length > 0 && currentColId && (
                <StatusBar
                  current={currentColId}
                  columns={columns}
                  moving={movingTo}
                  onChange={handleColChange}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <div style={{ width: 220, borderRight: '1px solid var(--border)', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 }}>
              {editing && (
                <div>
                  <label style={labelStyle}>Телефон</label>
                  <input style={inputStyle} value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                </div>
              )}
              <div>
                <div className="section-label" style={{ marginBottom: 8 }}>Ответственный</div>
                {editing ? (
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={editAssigned} onChange={e => setEditAssigned(e.target.value)}>
                    <option value="">Не назначен</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                ) : (
                  <div style={{ fontSize: 13, color: assignedEmp ? 'var(--text)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} color="var(--text-muted)" />{assignedEmp?.full_name ?? 'Не назначен'}
                  </div>
                )}
              </div>
              <div>
                <div className="section-label" style={{ marginBottom: 8 }}>Заметки</div>
                {editing ? (
                  <textarea style={textareaStyle} value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={4} />
                ) : (
                  <div style={{ fontSize: 13, color: detail.notes ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.6 }}>
                    {detail.notes || 'Нет заметок'}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div>Создан: {fmtDate(detail.created_at)}</div>
                <div>Обновлён: {fmtDate(detail.updated_at)}</div>
                {detail.fail_reason && <div style={{ marginTop: 6, color: 'var(--color-danger)' }}>Отказ: {detail.fail_reason}</div>}
              </div>
              {detail.status === 'success' && detail.client_id && (
                <div style={{ padding: 12, background: 'color-mix(in srgb, var(--color-success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-success)', marginBottom: 4 }}>Клиент создан!</div>
                </div>
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                {(['info', 'comments'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`, transition: 'color 150ms ease-out, border-color 150ms ease-out' }}>
                    {tab === 'info' ? 'Информация' : `Комментарии (${comments.length})`}
                  </button>
                ))}
              </div>

              {activeTab === 'info' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <InfoRow label="Имя" value={detail.full_name} />
                    <InfoRow label="Телефон" value={detail.phone ?? '—'} />
                    <InfoRow label="Источник" value={SOURCE_LABELS[detail.source] ?? detail.source} />
                    <InfoRow label="Этап" value={columns.find(c => c.id === currentColId)?.name ?? detail.status} />
                    <InfoRow label="Ответственный" value={assignedEmp?.full_name ?? 'Не назначен'} />
                    {detail.notes && <InfoRow label="Заметки" value={detail.notes} />}
                    {detail.fail_reason && <InfoRow label="Причина отказа" value={detail.fail_reason} />}
                    <InfoRow label="Создан" value={fmtDateTime(detail.created_at)} />
                    <InfoRow label="Обновлён" value={fmtDateTime(detail.updated_at)} />
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {comments.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Комментариев пока нет</div>
                    ) : comments.map(c => (
                      <div key={c.id} style={{ padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{c.profiles?.full_name ?? 'Сотрудник'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateTime(c.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.text}</div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 8 }}>
                    <textarea
                      style={{ ...textareaStyle, flex: 1 }}
                      placeholder="Написать комментарий..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      rows={2}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleAddComment() } }}
                    />
                    <button onClick={() => void handleAddComment()} disabled={addingComment || !commentText.trim()}
                      style={{ width: 36, height: 36, alignSelf: 'flex-end', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'var(--accent-fg)', cursor: (addingComment || !commentText.trim()) ? 'not-allowed' : 'pointer', opacity: (addingComment || !commentText.trim()) ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'opacity 150ms' }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right', lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

// ─── LeadCard ─────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead
  colColor: string
  isDragging: boolean
  employees: Employee[]
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function LeadCard({ lead, colColor, isDragging, employees, onClick, onDragStart, onDragEnd, onContextMenu }: LeadCardProps) {
  const assignedEmp = employees.find(e => e.profile_id === lead.assigned_to)
    ?? employees.find(e => e.id === lead.assigned_to)
  const commentCount = lead.lead_comments?.length ?? 0
  const days = daysInStage(lead.status_changed_at, lead.created_at)
  const stageColor = days >= 7 ? 'var(--color-danger)' : days >= 3 ? 'var(--color-warning)' : 'var(--text-muted)'
  const assigneeInitials = assignedEmp
    ? assignedEmp.full_name.split(' ').slice(0, 2).map(s => s[0] ?? '').join('').toUpperCase()
    : null

  return (
    <div
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      onClick={onClick} onContextMenu={onContextMenu}
      className="kanban-card"
      style={{ opacity: isDragging ? 0.35 : 1, transform: isDragging ? 'rotate(1deg)' : 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, letterSpacing: '-0.01em', flex: 1 }}>{lead.full_name}</div>
        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 5, flexShrink: 0, whiteSpace: 'nowrap', background: `color-mix(in srgb, ${colColor} 10%, transparent)`, color: colColor, border: `1px solid color-mix(in srgb, ${colColor} 25%, transparent)` }}>
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </span>
      </div>
      {lead.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          <Phone size={11} />{lead.phone}
        </div>
      )}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 7 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: stageColor, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={9} />{days}д
        </span>
        {commentCount > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MessageCircle size={10} />{commentCount}
          </span>
        )}
        {assignedEmp && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
              {assigneeInitials}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {assignedEmp.full_name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── LeadsKanban ──────────────────────────────────────────────────────────────

interface LeadsKanbanProps {
  leads: Lead[]
  columns: LeadFunnelColumn[]
  employees: Employee[]
  loading: boolean
  canManage: boolean
  onLeadClick: (lead: Lead) => void
  onCreateInCol: (colId: string) => void
  onColChange: (lead: Lead, col: LeadFunnelColumn) => void
  onDelete: (id: string) => void
  onFailReasonDrop: (lead: Lead) => void
}

function LeadsKanban({ leads, columns, employees, loading, canManage, onLeadClick, onCreateInCol, onColChange, onDelete, onFailReasonDrop }: LeadsKanbanProps) {
  const [dragOver, setDragOver]  = useState<string | null>(null)
  const [ctxMenu, setCtxMenu]    = useState<{ x: number; y: number; lead: Lead } | null>(null)
  const draggingRef = useRef<Lead | null>(null)

  const handleDrop = (e: React.DragEvent, col: LeadFunnelColumn) => {
    e.preventDefault(); setDragOver(null)
    const lead = draggingRef.current; draggingRef.current = null
    if (!lead) return
    const currentColId = getLeadColumnId(lead, columns)
    if (currentColId === col.id) return
    if (col.status_key === 'fail') { onFailReasonDrop(lead); return }
    onColChange(lead, col)
  }

  const buildCtxItems = (lead: Lead): ContextMenuEntry[] => [
    { label: 'Открыть карточку', icon: <ChevronRight size={13} />, onClick: () => onLeadClick(lead) },
    { separator: true } as ContextMenuEntry,
    ...columns.filter(c => c.id !== getLeadColumnId(lead, columns)).map(c => ({
      label: `→ ${c.name}`,
      onClick: () => {
        if (c.status_key === 'fail') { onFailReasonDrop(lead); return }
        onColChange(lead, c)
      },
    })),
    { separator: true } as ContextMenuEntry,
    { label: 'Удалить', icon: <Trash2 size={13} />, danger: true, onClick: () => { if (confirm('Удалить лид?')) onDelete(lead.id) } },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {[...Array(Math.max(columns.length, 4))].map((_, i) => (
          <Skeleton key={i} style={{ flex: '1 0 220px', minWidth: 220 }} className="h-[400px] rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0, overflowX: 'auto', paddingBottom: 8 }}>
        {columns.map(col => {
          const colLeads = leads.filter(l => getLeadColumnId(l, columns) === col.id)
          const isOver   = dragOver === col.id

          return (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDrop={e => void handleDrop(e, col)}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null) }}
              style={{
                flex: '1 0 220px', minWidth: 220, maxWidth: 280,
                display: 'flex', flexDirection: 'column',
                background: isOver ? `color-mix(in srgb, ${col.color} 5%, var(--bg-card))` : 'var(--bg-card)',
                border: `1px solid ${isOver ? `color-mix(in srgb, ${col.color} 50%, transparent)` : 'var(--border)'}`,
                borderRadius: 12, overflow: 'hidden',
                transition: 'border-color 180ms ease-out, background 180ms ease-out',
                boxShadow: isOver ? `0 0 0 2px color-mix(in srgb, ${col.color} 20%, transparent)` : 'none',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: `color-mix(in srgb, ${col.color} 5%, transparent)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: col.color }}>{col.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: `color-mix(in srgb, ${col.color} 15%, transparent)`, color: col.color }}>
                    {colLeads.length}
                  </span>
                </div>
                {canManage && (
                  <button onClick={() => onCreateInCol(col.id)} className="icon-btn" style={{ width: 22, height: 22 }}>
                    <Plus size={11} />
                  </button>
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {colLeads.length === 0 && (
                  <div style={{ fontSize: 12, color: isOver ? col.color : 'var(--text-muted)', textAlign: 'center', padding: '20px 0', border: isOver ? `2px dashed color-mix(in srgb, ${col.color} 40%, transparent)` : 'none', borderRadius: 8 }}>
                    {isOver ? 'Отпустите здесь' : 'Нет лидов'}
                  </div>
                )}
                {colLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    colColor={col.color}
                    isDragging={draggingRef.current?.id === lead.id}
                    employees={employees}
                    onClick={() => onLeadClick(lead)}
                    onDragStart={e => { draggingRef.current = lead; e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { draggingRef.current = null; setDragOver(null) }}
                    onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, lead }) }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={buildCtxItems(ctxMenu.lead)} onClose={() => setCtxMenu(null)} />
      )}
    </>
  )
}

// ─── LeadsTable ───────────────────────────────────────────────────────────────

interface LeadsTableProps {
  leads: Lead[]
  columns: LeadFunnelColumn[]
  employees: Employee[]
  onLeadClick: (lead: Lead) => void
  onDelete: (id: string) => void
}

function LeadsTable({ leads, columns, employees, onLeadClick, onDelete }: LeadsTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => {
      let va: string | number = 0
      let vb: string | number = 0
      if (sortField === 'full_name') { va = a.full_name; vb = b.full_name }
      else if (sortField === 'created_at') { va = a.created_at; vb = b.created_at }
      else if (sortField === 'days') { va = daysInStage(a.status_changed_at, a.created_at); vb = daysInStage(b.status_changed_at, b.created_at) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [leads, sortField, sortDir])

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const thStyle = (field?: SortField): React.CSSProperties => ({
    padding: '10px 14px', fontSize: 11, fontWeight: 600,
    textAlign: 'left', whiteSpace: 'nowrap',
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border)',
    cursor: field ? 'pointer' : 'default',
    userSelect: 'none',
    color: (field && sortField === field) ? 'var(--accent)' : 'var(--text-muted)',
  })

  const tdStyle: React.CSSProperties = {
    padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border)', verticalAlign: 'middle',
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle('full_name')} onClick={() => toggleSort('full_name')}>
                ФИО {sortField === 'full_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={thStyle()}>Телефон</th>
              <th style={thStyle()}>Источник</th>
              <th style={thStyle()}>Этап</th>
              <th style={thStyle()}>Менеджер</th>
              <th style={thStyle('created_at')} onClick={() => toggleSort('created_at')}>
                Дата записи {sortField === 'created_at' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={thStyle('days')} onClick={() => toggleSort('days')}>
                Дней {sortField === 'days' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={thStyle()}></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Нет лидов</td>
              </tr>
            )}
            {paged.map(lead => {
              const colId = getLeadColumnId(lead, columns)
              const col   = columns.find(c => c.id === colId)
              const emp   = employees.find(e => e.profile_id === lead.assigned_to) ?? employees.find(e => e.id === lead.assigned_to)
              const days  = daysInStage(lead.status_changed_at, lead.created_at)
              const daysColor = days >= 7 ? 'var(--color-danger)' : days >= 3 ? 'var(--color-warning)' : 'var(--text-muted)'

              return (
                <tr key={lead.id} style={{ cursor: 'pointer' }}
                  onClick={() => onLeadClick(lead)}
                  className="table-row-hover"
                >
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text)' }}>{lead.full_name}</td>
                  <td style={tdStyle}>{lead.phone ?? '—'}</td>
                  <td style={tdStyle}>{SOURCE_LABELS[lead.source] ?? lead.source}</td>
                  <td style={tdStyle}>
                    {col ? (
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `color-mix(in srgb, ${col.color} 12%, transparent)`, color: col.color, border: `1px solid color-mix(in srgb, ${col.color} 25%, transparent)` }}>
                        {col.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={tdStyle}>{emp?.full_name ?? '—'}</td>
                  <td style={tdStyle}>{fmtDate(lead.created_at)}</td>
                  <td style={{ ...tdStyle, color: daysColor, fontWeight: 600 }}>{days}д</td>
                  <td style={tdStyle} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { if (confirm('Удалить лид?')) onDelete(lead.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sorted.length} лидов · стр {page + 1} из {totalPages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn btn-secondary" style={{ height: 28, padding: '0 10px', fontSize: 12 }}>←</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn btn-secondary" style={{ height: 28, padding: '0 10px', fontSize: 12 }}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PipelineCard ────────────────────────────────────────────────────────────

function PipelineCard({ entry, colColor, isDragging, onStatusChange, onRemove }: { entry: ClientPipeline; colColor: string; isDragging: boolean; onStatusChange: (id: string, status: ClientPipelineStatus) => void; onRemove: (id: string) => void }) {
  const client = entry.clients
  const subs   = client?.subscriptions ?? []
  const activeSub = subs.find(s => s.status === 'active') ?? subs[0] ?? null

  return (
    <div className="kanban-card" style={{ opacity: isDragging ? 0.35 : 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 4 }}>{client?.full_name ?? '—'}</div>
      {client?.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          <Phone size={11} />{client.phone}
        </div>
      )}
      {activeSub && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          <span style={{ padding: '1px 6px', borderRadius: 4, background: `color-mix(in srgb, ${colColor} 10%, transparent)`, color: colColor, border: `1px solid color-mix(in srgb, ${colColor} 25%, transparent)` }}>
            {activeSub.name}
          </span>
          {' · '}до {fmtDate(activeSub.date_end)}
        </div>
      )}
      <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(entry.created_at)}</span>
        <button onClick={() => { if (confirm('Убрать из pipeline?')) onRemove(entry.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
          <X size={11} />
        </button>
      </div>
    </div>
  )
}

function PipelineKanban({ entries, loading, canManage, onStatusChange, onRemove }: { entries: ClientPipeline[]; loading: boolean; canManage: boolean; onStatusChange: (id: string, status: ClientPipelineStatus) => void; onRemove: (id: string) => void }) {
  const [dragOver, setDragOver] = useState<ClientPipelineStatus | null>(null)
  const draggingRef = useRef<string | null>(null)

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {PIPELINE_COLUMNS.map((_, i) => <Skeleton key={i} style={{ flex: '1 0 200px', minWidth: 200 }} className="h-[400px] rounded-xl" />)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0, overflowX: 'auto', paddingBottom: 8 }}>
      {PIPELINE_COLUMNS.map(col => {
        const colEntries = entries.filter(e => e.status === col.id)
        const isOver = dragOver === col.id
        return (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
            onDrop={e => { e.preventDefault(); setDragOver(null); const id = draggingRef.current; draggingRef.current = null; if (!id) return; const entry = entries.find(en => en.id === id); if (!entry || entry.status === col.id) return; onStatusChange(id, col.id) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null) }}
            style={{ flex: '1 0 200px', minWidth: 200, maxWidth: 260, display: 'flex', flexDirection: 'column', background: isOver ? `color-mix(in srgb, ${col.color} 5%, var(--bg-card))` : 'var(--bg-card)', border: `1px solid ${isOver ? `color-mix(in srgb, ${col.color} 50%, transparent)` : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 180ms ease-out, background 180ms ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 12px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: `color-mix(in srgb, ${col.color} 5%, transparent)` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: col.color }}>{col.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: `color-mix(in srgb, ${col.color} 15%, transparent)`, color: col.color }}>{colEntries.length}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {colEntries.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Нет клиентов</div>}
              {colEntries.map(entry => (
                <div key={entry.id} draggable onDragStart={e => { draggingRef.current = entry.id; e.dataTransfer.effectAllowed = 'move' }} onDragEnd={() => { draggingRef.current = null; setDragOver(null) }}>
                  <PipelineCard entry={entry} colColor={col.color} isDragging={draggingRef.current === entry.id} onStatusChange={onStatusChange} onRemove={onRemove} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── LostClientsTab ───────────────────────────────────────────────────────────

function LostClientCard({ client, onCreateLead, onAddToPipeline }: { client: LostClient; onCreateLead: (c: LostClient) => void; onAddToPipeline: (c: LostClient) => void }) {
  const urgency = client.days_since_end >= 60 ? 'var(--color-danger)' : client.days_since_end >= 30 ? 'var(--color-warning)' : 'var(--text-muted)'
  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{client.full_name}</div>
          {client.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}><Phone size={11} />{client.phone}</div>}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: urgency, flexShrink: 0 }}>{client.days_since_end}д назад</span>
      </div>
      {client.last_subscription && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          Последний: <span style={{ color: 'var(--text-secondary)' }}>{client.last_subscription.name}</span>{' · '}истёк {fmtDate(client.last_subscription.date_end)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onCreateLead(client)} style={{ flex: 1, height: 28, background: 'var(--accent)', border: 'none', borderRadius: 6, color: 'var(--accent-fg)', fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Plus size={12} />Создать лид
        </button>
        <button onClick={() => onAddToPipeline(client)} style={{ flex: 1, height: 28, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <ArrowRight size={12} />В pipeline
        </button>
      </div>
    </div>
  )
}

function LostClientsTab({ onAddToPipeline, onCreateLead }: { onAddToPipeline: (c: LostClient) => void; onCreateLead: (c: LostClient) => void }) {
  const [clients, setClients] = useState<LostClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/clients/lost')
      .then(r => setClients(Array.isArray(r.data) ? r.data as LostClient[] : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4].map(i => <Skeleton key={i} className="h-[100px] rounded-xl" />)}</div>
  if (clients.length === 0) return <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>Нет потерянных клиентов</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, overflowY: 'auto', paddingBottom: 8 }}>
      {clients.map(c => <LostClientCard key={c.id} client={c} onCreateLead={onCreateLead} onAddToPipeline={onAddToPipeline} />)}
    </div>
  )
}

// ─── FunnelSettingsSheet ──────────────────────────────────────────────────────

interface FunnelSettingsSheetProps {
  columns: LeadFunnelColumn[]
  onClose: () => void
  onSave: (cols: LeadFunnelColumn[]) => void
  onAdd: (name: string, color: string) => void
  onDelete: (id: string) => void
}

function FunnelSettingsSheet({ columns, onClose, onSave, onAdd, onDelete }: FunnelSettingsSheetProps) {
  const [localCols, setLocalCols] = useState<LeadFunnelColumn[]>(() => [...columns].sort((a, b) => a.position - b.position))
  const [editing, setEditing]     = useState<Record<string, string>>({})
  const [newName, setNewName]     = useState('')
  const [newColor, setNewColor]   = useState('#6b7280')
  const [saving, setSaving]       = useState(false)
  const [dragIdx, setDragIdx]     = useState<number | null>(null)
  const [dragOver, setDragOver]   = useState<number | null>(null)

  const handleNameChange = (id: string, val: string) => setEditing(prev => ({ ...prev, [id]: val }))

  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragEnter = (i: number) => setDragOver(i)
  const handleDragEnd   = () => {
    if (dragIdx !== null && dragOver !== null && dragIdx !== dragOver) {
      const arr = [...localCols]
      const [moved] = arr.splice(dragIdx, 1)
      arr.splice(dragOver, 0, moved)
      setLocalCols(arr)
    }
    setDragIdx(null); setDragOver(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const withNames = localCols.map((c, i) => ({ ...c, name: editing[c.id] ?? c.name, position: i }))
      await onSave(withNames)
      onClose()
    } finally { setSaving(false) }
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd(newName.trim(), newColor)
    setNewName(''); setNewColor('#6b7280')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
      <div className="modal-animate" style={{ width: 360, background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Настройки колонок</div>
          <button onClick={onClose} className="icon-btn"><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {localCols.map((col, i) => (
              <div
                key={col.id}
                draggable={!col.is_locked}
                onDragStart={() => handleDragStart(i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px',
                  background: dragOver === i ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--bg)',
                  border: `1px solid ${dragOver === i ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border)'}`,
                  borderRadius: 8,
                  transition: 'border-color 150ms ease-out, background 150ms ease-out',
                }}
              >
                <div style={{ cursor: col.is_locked ? 'default' : 'grab', color: 'var(--text-muted)', display: 'flex', flexShrink: 0, opacity: col.is_locked ? 0.3 : 1 }}>
                  <GripVertical size={14} />
                </div>
                <input
                  type="color"
                  value={col.color.startsWith('#') ? col.color : '#6b7280'}
                  onChange={e => {
                    const color = e.target.value
                    setLocalCols(prev => prev.map(c => c.id === col.id ? { ...c, color } : c))
                  }}
                  style={{ width: 22, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none', flexShrink: 0 }}
                />
                <input
                  value={editing[col.id] ?? col.name}
                  onChange={e => handleNameChange(col.id, e.target.value)}
                  disabled={col.is_locked}
                  style={{ ...inputStyle, flex: 1, height: 28, fontSize: 12, opacity: col.is_locked ? 0.6 : 1 }}
                />
                {col.is_locked ? (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0, padding: '2px 5px', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border)' }}>🔒</span>
                ) : (
                  <button onClick={() => { if (confirm(`Удалить колонку "${col.name}"?`)) onDelete(col.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Добавить колонку</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none', flexShrink: 0 }} />
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Название этапа..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              />
              <button onClick={handleAdd} disabled={!newName.trim()} className="btn btn-primary" style={{ height: 36, padding: '0 12px', flexShrink: 0 }}>
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => void handleSave()} disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AnalyticsModal (stub) ────────────────────────────────────────────────────

function AnalyticsModal({ leads, columns, onClose }: { leads: Lead[]; columns: LeadFunnelColumn[]; onClose: () => void }) {
  const byCol = columns.map(c => ({
    ...c,
    count: leads.filter(l => getLeadColumnId(l, columns) === c.id).length,
  }))
  const total    = leads.length
  const successCol = columns.find(c => c.status_key === 'success')
  const successCount = successCol ? leads.filter(l => getLeadColumnId(l, columns) === successCol.id).length : 0
  const conversion = total > 0 ? Math.round((successCount / total) * 100) : 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 560, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Аналитика воронки</div>
          <button onClick={onClose} className="icon-btn"><X size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Всего лидов</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{total}</div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Конверсия</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)' }}>{conversion}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {byCol.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{c.name}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.count}</span>
              <div style={{ width: 100, height: 4, background: 'var(--border)', borderRadius: 2, flexShrink: 0, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${total > 0 ? (c.count / total) * 100 : 0}%`, background: c.color, borderRadius: 2, transition: 'width 300ms ease-out' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TabSwitcher ──────────────────────────────────────────────────────────────

function TabSwitcher({ active, onChange, counts }: { active: LeadsTab; onChange: (t: LeadsTab) => void; counts: { leads: number; pipeline: number } }) {
  const tabs: { id: LeadsTab; label: string; count?: number }[] = [
    { id: 'leads',    label: 'Обращения',  count: counts.leads },
    { id: 'pipeline', label: 'Клиенты',    count: counts.pipeline },
    { id: 'lost',     label: 'Потерянные' },
  ]
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', background: active === tab.id ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', border: active === tab.id ? '1px solid color-mix(in srgb, var(--accent) 35%, transparent)' : '1px solid transparent', borderRadius: 6, color: active === tab.id ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: active === tab.id ? 600 : 400, cursor: 'pointer', transition: 'background 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out' }}>
          {tab.label}
          {tab.count !== undefined && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '0 5px', borderRadius: 20, background: active === tab.id ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--bg)', color: active === tab.id ? 'var(--accent)' : 'var(--text-muted)' }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── LeadsPage ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  // Funnel state
  const [funnels, setFunnels]             = useState<LeadFunnel[]>([])
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null)
  const [funnelColumns, setFunnelColumns] = useState<LeadFunnelColumn[]>([])
  const [funnelLoading, setFunnelLoading] = useState(true)

  // View state
  const [activeTab, setActiveTab]   = useState<LeadsTab>('leads')
  const [viewMode, setViewMode]     = useState<'kanban' | 'list'>('kanban')

  // UI panels
  const [showFunnelDropdown, setShowFunnelDropdown]   = useState(false)
  const [showFunnelSettings, setShowFunnelSettings]   = useState(false)
  const [showCreateFunnel, setShowCreateFunnel]       = useState(false)
  const [showAnalytics, setShowAnalytics]             = useState(false)
  const [newFunnelName, setNewFunnelName]             = useState('')
  const [creatingFunnel, setCreatingFunnel]           = useState(false)
  const funnelDropdownRef = useRef<HTMLDivElement>(null)

  // Data
  const [leads, setLeads]         = useState<Lead[]>([])
  const [pipeline, setPipeline]   = useState<ClientPipeline[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [failReasons, setFailReasons] = useState<FailReason[]>([])
  const [loading, setLoading]     = useState(true)
  const [pipelineLoading, setPipelineLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Modals
  const [selectedLead, setSelectedLead]       = useState<Lead | null>(null)
  const [createCol, setCreateCol]             = useState<string | null>(null)
  const [clientAddedModal, setClientAddedModal] = useState<{ id: string | null; full_name: string | null; phone: string | null } | null>(null)
  const [failReasonDrop, setFailReasonDrop]   = useState<Lead | null>(null)
  const [pendingDropCol, setPendingDropCol]   = useState<LeadFunnelColumn | null>(null)

  // Filters
  const [filterSearch, setFilterSearch]   = useState('')
  const [filterColumn, setFilterColumn]   = useState('')
  const [filterSource, setFilterSource]   = useState('')
  const [filterManager, setFilterManager] = useState('')
  const [filterArchived, setFilterArchived] = useState(false)
  const { period, customFrom, customTo, dateFromStr, dateToStr, setPeriod, remember, setRemember } = usePeriodFilter('leads')

  const canManage = ['developer', 'owner', 'franchisee', 'admin', 'staff'].includes(user?.role ?? '')
  const activeFunnel = funnels.find(f => f.id === activeFunnelId) ?? null

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (funnelDropdownRef.current && !funnelDropdownRef.current.contains(e.target as Node)) {
        setShowFunnelDropdown(false)
      }
    }
    if (showFunnelDropdown) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFunnelDropdown])

  const loadFunnels = useCallback(async () => {
    setFunnelLoading(true)
    try {
      let data = await leadFunnelsApi.getAll()
      if (data.length === 0) {
        const created = await leadFunnelsApi.create({ name: 'Стандартная', is_default: true })
        data = [{ ...created, leads_count: 0 }]
      }
      setFunnels(data)
      const def = data.find(f => f.is_default) ?? data[0]
      if (def) setActiveFunnelId(def.id)
    } catch {
      setError('Не удалось загрузить воронки')
    } finally {
      setFunnelLoading(false)
    }
  }, [])

  const loadColumns = useCallback(async (funnelId: string) => {
    try {
      const cols = await leadFunnelColumnsApi.getByFunnel(funnelId)
      setFunnelColumns(cols.sort((a, b) => a.position - b.position))
    } catch { /* */ }
  }, [])

  const loadLeads = useCallback(async () => {
    if (!activeFunnelId) return
    setLoading(true); setError(null)
    try {
      const [leadsData, empsData] = await Promise.all([
        leadsApi.getAll({ from: dateFromStr, to: dateToStr, archived: filterArchived }),
        employeesApi.getAll().catch(() => [] as Employee[]),
      ])
      setLeads(leadsData)
      setEmployees(empsData)
    } catch {
      setError('Не удалось загрузить лиды')
    } finally {
      setLoading(false)
    }
  }, [dateFromStr, dateToStr, filterArchived, activeFunnelId])

  const loadPipeline = useCallback(async () => {
    setPipelineLoading(true)
    try {
      const data = await clientPipelineApi.getAll()
      setPipeline(data)
    } catch { /* */ } finally { setPipelineLoading(false) }
  }, [])

  const loadFailReasons = useCallback(async () => {
    try {
      const data = await failReasonsApi.getAll()
      setFailReasons(data)
    } catch { /* */ }
  }, [])

  useEffect(() => { void loadFunnels(); void loadFailReasons() }, [loadFunnels, loadFailReasons])
  useEffect(() => { if (activeFunnelId) void loadColumns(activeFunnelId) }, [activeFunnelId, loadColumns])
  useEffect(() => { void loadLeads() }, [loadLeads])
  useEffect(() => {
    if (activeTab === 'pipeline' && pipeline.length === 0 && !pipelineLoading) void loadPipeline()
  }, [activeTab]) // eslint-disable-line

  // Filtered leads
  const filteredLeads = useMemo(() => {
    let list = leads
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      list = list.filter(l => l.full_name.toLowerCase().includes(q) || (l.phone ?? '').includes(q))
    }
    if (filterColumn) {
      list = list.filter(l => getLeadColumnId(l, funnelColumns) === filterColumn)
    }
    if (filterSource) list = list.filter(l => l.source === filterSource)
    if (filterManager) list = list.filter(l => l.assigned_to === filterManager || employees.find(e => e.id === filterManager)?.profile_id === l.assigned_to)
    return list
  }, [leads, filterSearch, filterColumn, filterSource, filterManager, funnelColumns, employees])

  const handleExport = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(filteredLeads.map(l => {
      const colId = getLeadColumnId(l, funnelColumns)
      const col   = funnelColumns.find(c => c.id === colId)
      return {
        'Имя':             l.full_name,
        'Телефон':         l.phone ?? '',
        'Этап':            col?.name ?? l.status,
        'Источник':        SOURCE_LABELS[l.source] ?? l.source,
        'Ответственный':   (employees.find(e => e.profile_id === l.assigned_to) ?? employees.find(e => e.id === l.assigned_to))?.full_name ?? '',
        'Дней в статусе':  daysInStage(l.status_changed_at, l.created_at),
        'Создан':          new Date(l.created_at).toLocaleDateString('ru-RU'),
      }
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Лиды')
    XLSX.writeFile(wb, 'leads.xlsx')
  }

  const doColChange = async (lead: Lead, col: LeadFunnelColumn, fail_reason?: string) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, funnel_column_id: col.id, status: (col.status_key as LeadStatus | null) ?? l.status } : l))
    try {
      let result: { lead: Lead; client: { id: string; full_name: string; phone: string | null } | null }
      if (col.status_key) {
        result = await leadsApi.updateStatus(lead.id, col.status_key as LeadStatus, fail_reason)
        await leadsApi.update(lead.id, { funnel_column_id: col.id })
        result.lead.funnel_column_id = col.id
      } else {
        const updated = await leadsApi.update(lead.id, { funnel_column_id: col.id })
        result = { lead: updated, client: null }
      }
      setLeads(prev => prev.map(l => l.id === lead.id ? result.lead : l))
      if (col.status_key === 'success') {
        setClientAddedModal(result.client
          ? { id: result.client.id, full_name: result.client.full_name, phone: result.client.phone }
          : { id: null, full_name: null, phone: null }
        )
      }
      // Refresh funnels count
      setFunnels(prev => prev.map(f => f.id === activeFunnelId ? { ...f, leads_count: f.leads_count ?? 0 } : f))
    } catch {
      setLeads(prev => prev.map(l => l.id === lead.id ? lead : l))
    }
  }

  const handleLeadUpdate = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    setSelectedLead(updated)
  }

  const handleLeadDelete = async (id: string) => {
    try {
      await leadsApi.delete(id)
      setLeads(prev => prev.filter(l => l.id !== id))
      setSelectedLead(null)
    } catch { /* */ }
  }

  const handleLeadCreate = (lead: Lead) => {
    setLeads(prev => [lead, ...prev])
    setCreateCol(null)
    playSound('new_lead')
  }

  const handleCreateFunnel = async () => {
    if (!newFunnelName.trim()) return
    setCreatingFunnel(true)
    try {
      const created = await leadFunnelsApi.create({ name: newFunnelName.trim() })
      setFunnels(prev => [...prev, { ...created, leads_count: 0 }])
      setActiveFunnelId(created.id)
      setNewFunnelName('')
      setShowCreateFunnel(false)
      setShowFunnelDropdown(false)
    } catch { /* */ } finally { setCreatingFunnel(false) }
  }

  const handleSaveColumns = async (cols: LeadFunnelColumn[]) => {
    await leadFunnelColumnsApi.reorder(cols.map((c, i) => ({ id: c.id, position: i })))
    // Save name/color changes
    for (const col of cols) {
      const orig = funnelColumns.find(c => c.id === col.id)
      if (orig && (orig.name !== col.name || orig.color !== col.color)) {
        await leadFunnelColumnsApi.update(col.id, { name: col.name, color: col.color })
      }
    }
    const updated = await leadFunnelColumnsApi.getByFunnel(activeFunnelId!)
    setFunnelColumns(updated.sort((a, b) => a.position - b.position))
  }

  const handleAddColumn = async (name: string, color: string) => {
    if (!activeFunnelId) return
    const col = await leadFunnelColumnsApi.create({ funnel_id: activeFunnelId, name, color, position: funnelColumns.length })
    setFunnelColumns(prev => [...prev, col])
  }

  const handleDeleteColumn = async (id: string) => {
    await leadFunnelColumnsApi.delete(id)
    setFunnelColumns(prev => prev.filter(c => c.id !== id))
    // reassign leads in this column
    setLeads(prev => prev.map(l => l.funnel_column_id === id ? { ...l, funnel_column_id: null } : l))
  }

  const handlePipelineStatusChange = async (id: string, status: ClientPipelineStatus) => {
    setPipeline(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    try { const u = await clientPipelineApi.updateStatus(id, status); setPipeline(prev => prev.map(e => e.id === id ? u : e)) }
    catch { void loadPipeline() }
  }

  const handleAddLostToPipeline = async (client: LostClient) => {
    try { const entry = await clientPipelineApi.create(client.id, 'not_renewed'); setPipeline(prev => [...prev, entry]); setActiveTab('pipeline') } catch { /* */ }
  }

  const handleCreateLeadFromLost = (client: LostClient) => {
    leadsApi.create({ full_name: client.full_name, phone: client.phone ?? undefined, source: 'manual' })
      .then(lead => { setLeads(prev => [lead, ...prev]); setActiveTab('leads'); setSelectedLead(lead); playSound('new_lead') })
      .catch(() => {})
  }

  const activeFunnelName = activeFunnel?.name ?? 'Воронка'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 42px)', minHeight: 0 }}>
      <PageHeader
        title="Заявки"
        subtitle={
          activeTab === 'leads'
            ? `${filteredLeads.length} обращений${activeFunnel ? ` · ${activeFunnelName}` : ''}`
            : activeTab === 'pipeline'
            ? `${pipeline.length} в pipeline`
            : 'Потерянные клиенты'
        }
        filters={activeTab === 'leads' ? (
          <PeriodFilter period={period} customFrom={customFrom} customTo={customTo} remember={remember} onChange={setPeriod} onRememberChange={setRemember} />
        ) : undefined}
        actions={<>
          {activeTab === 'leads' && !funnelLoading && (
            <>
              {/* Funnel selector */}
              <div ref={funnelDropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowFunnelDropdown(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  {activeFunnelName}
                  <ChevronDown size={13} style={{ color: 'var(--text-muted)', transition: 'transform 150ms', transform: showFunnelDropdown ? 'rotate(180deg)' : 'none' }} />
                </button>
                {showFunnelDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 0', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 100, minWidth: 220 }}>
                    {funnels.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setActiveFunnelId(f.id); setShowFunnelDropdown(false) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: f.id === activeFunnelId ? 'var(--accent)' : 'var(--text)', textAlign: 'left' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {f.id === activeFunnelId && <Check size={12} />}
                          {f.name}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'var(--bg)', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {f.leads_count ?? 0}
                        </span>
                      </button>
                    ))}
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    {!showCreateFunnel ? (
                      <button
                        onClick={() => setShowCreateFunnel(true)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent)' }}
                      >
                        <Plus size={13} />Создать воронку
                      </button>
                    ) : (
                      <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                        <input
                          autoFocus
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder="Название воронки..."
                          value={newFunnelName}
                          onChange={e => setNewFunnelName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') void handleCreateFunnel(); if (e.key === 'Escape') { setShowCreateFunnel(false); setNewFunnelName('') } }}
                        />
                        <button onClick={() => void handleCreateFunnel()} disabled={creatingFunnel || !newFunnelName.trim()} className="btn btn-primary" style={{ height: 36, padding: '0 10px', flexShrink: 0 }}>
                          {creatingFunnel ? '...' : <Check size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Settings button */}
              <button onClick={() => setShowFunnelSettings(true)} className="icon-btn" title="Настройки колонок">
                <Settings size={15} />
              </button>

              {/* Filters */}
              <select
                value={filterColumn}
                onChange={e => setFilterColumn(e.target.value)}
                style={{ height: 32, padding: '0 10px', background: 'var(--bg-card)', border: `1px solid ${filterColumn ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', color: filterColumn ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="">Все этапы</option>
                {funnelColumns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value)}
                style={{ height: 32, padding: '0 10px', background: 'var(--bg-card)', border: `1px solid ${filterSource ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', color: filterSource ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="">Все источники</option>
                {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              {/* View toggle */}
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('kanban')}
                  style={{ height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'kanban' ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-card)', border: 'none', cursor: 'pointer', color: viewMode === 'kanban' ? 'var(--accent)' : 'var(--text-muted)', transition: 'background 150ms ease-out' }}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{ height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === 'list' ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-card)', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)', transition: 'background 150ms ease-out' }}
                >
                  <List size={14} />
                </button>
              </div>

              <button onClick={() => void handleExport()} className="btn btn-secondary" style={{ gap: 6 }}>
                <Download size={14} />Excel
              </button>
              <button onClick={() => setShowAnalytics(true)} className="btn btn-secondary" style={{ gap: 6 }}>
                <BarChart2 size={14} />Аналитика
              </button>
              {canManage && (
                <button onClick={() => setCreateCol(activeFunnel ? (funnelColumns.find(c => c.status_key === 'new')?.id ?? null) : null)} className="btn btn-primary" style={{ gap: 6 }}>
                  <Plus size={15} strokeWidth={2.5} />Новый лид
                </button>
              )}
            </>
          )}
          {activeTab === 'pipeline' && canManage && (
            <button onClick={() => setActiveTab('leads')} className="btn btn-secondary" style={{ gap: 6 }}>
              <ArrowRight size={14} />К лидам
            </button>
          )}
        </>}
        tabs={
          <TabSwitcher
            active={activeTab}
            onChange={t => { setActiveTab(t) }}
            counts={{ leads: filteredLeads.length, pipeline: pipeline.length }}
          />
        }
      />

      {/* Search bar for leads tab */}
      {activeTab === 'leads' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '0 1 280px' }}>
            <input
              style={{ ...inputStyle, paddingLeft: 32 }}
              placeholder="Поиск по имени или телефону..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
            />
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
              <User size={13} />
            </div>
          </div>
          {filterManager !== '' || filterSearch !== '' || filterColumn !== '' || filterSource !== '' ? (
            <button
              onClick={() => { setFilterSearch(''); setFilterColumn(''); setFilterSource(''); setFilterManager('') }}
              style={{ height: 32, padding: '0 10px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)', borderRadius: 8, marginBottom: 12, fontSize: 12, color: 'var(--color-danger)', flexShrink: 0 }}>
          <AlertCircle size={13} />{error}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'leads' && viewMode === 'kanban' && (
          <LeadsKanban
            leads={filteredLeads}
            columns={funnelColumns}
            employees={employees}
            loading={loading || funnelLoading}
            canManage={canManage}
            onLeadClick={setSelectedLead}
            onCreateInCol={setCreateCol}
            onColChange={(lead, col) => void doColChange(lead, col)}
            onDelete={id => void handleLeadDelete(id)}
            onFailReasonDrop={lead => { setFailReasonDrop(lead); setPendingDropCol(funnelColumns.find(c => c.status_key === 'fail') ?? null) }}
          />
        )}
        {activeTab === 'leads' && viewMode === 'list' && (
          <LeadsTable
            leads={filteredLeads}
            columns={funnelColumns}
            employees={employees}
            onLeadClick={setSelectedLead}
            onDelete={id => void handleLeadDelete(id)}
          />
        )}
        {activeTab === 'pipeline' && (
          <PipelineKanban
            entries={pipeline}
            loading={pipelineLoading}
            canManage={canManage}
            onStatusChange={handlePipelineStatusChange}
            onRemove={async id => { try { await clientPipelineApi.delete(id); setPipeline(prev => prev.filter(e => e.id !== id)) } catch { /* */ } }}
          />
        )}
        {activeTab === 'lost' && (
          <LostClientsTab onAddToPipeline={handleAddLostToPipeline} onCreateLead={handleCreateLeadFromLost} />
        )}
      </div>

      {/* Modals */}
      {createCol !== null && (
        <CreateLeadModal
          initialColumnId={createCol}
          employees={employees}
          onClose={() => setCreateCol(null)}
          onCreate={handleLeadCreate}
        />
      )}

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          columns={funnelColumns}
          employees={employees}
          failReasons={failReasons}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
          onDelete={id => void handleLeadDelete(id)}
        />
      )}

      {clientAddedModal !== null && (
        <ClientAddedModal
          clientId={clientAddedModal.id}
          clientName={clientAddedModal.full_name}
          onGoToClient={() => { const cid = clientAddedModal.id; setClientAddedModal(null); if (cid) navigate(`/clients/${cid}`) }}
          onClose={() => setClientAddedModal(null)}
        />
      )}

      {failReasonDrop && (
        <FailReasonModal
          failReasons={failReasons}
          onConfirm={reason => {
            const lead = failReasonDrop
            const col  = pendingDropCol
            setFailReasonDrop(null); setPendingDropCol(null)
            if (col) void doColChange(lead, col, reason)
          }}
          onClose={() => { setFailReasonDrop(null); setPendingDropCol(null) }}
        />
      )}

      {showFunnelSettings && activeFunnelId && (
        <FunnelSettingsSheet
          columns={funnelColumns}
          onClose={() => setShowFunnelSettings(false)}
          onSave={handleSaveColumns}
          onAdd={handleAddColumn}
          onDelete={handleDeleteColumn}
        />
      )}

      {showAnalytics && (
        <AnalyticsModal
          leads={filteredLeads}
          columns={funnelColumns}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  )
}
