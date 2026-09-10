import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Users, Search, Plus, X, AlertCircle, Phone, Mail, Calendar,
  Edit2, Trash2, CreditCard, Eye, FileText, MoreVertical, History,
  Download, Tag, Cake, Snowflake, CheckCircle2, Clock, TrendingUp,
  MessageCircle, Link, QrCode, Copy, Send,
  ChevronUp, ChevronDown, Settings2, ChevronLeft, ChevronRight,
  SlidersHorizontal, Check,
} from 'lucide-react'
import { getRenewalColor } from '../../utils/renewalProbability'
import { QRCodeSVG } from 'qrcode.react'
import { clientsApi } from '../../api/clients.api'
import { api } from '../../lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { subscriptionsApi } from '../../api/subscriptions.api'
import { ContextMenu, type ContextMenuEntry } from '../../components/ContextMenu'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import type { Client, ClientDetail, ClientBooking, Subscription, AuditLogEntry, SubscriptionRenewal } from '../../types'

const DEVICE_TYPE_LABELS: Record<string, string> = {
  vacuactiv: 'VacuActiv', rollshape: 'RollShape', infrastep: 'InfraStep', infrashape: 'InfraShape',
}
const DEVICE_TYPE_COLORS: Record<string, string> = {
  vacuactiv: 'var(--accent)', rollshape: '#263CD9', infrastep: '#8b5cf6', infrashape: 'var(--color-warning)',
}
const SUB_STATUS_COLOR: Record<string, string> = { active: 'var(--color-success)', frozen: 'var(--color-warning)', expired: '#71717A', cancelled: 'var(--color-danger)' }
const SUB_STATUS_LABEL: Record<string, string> = { active: 'Активный', frozen: 'Заморожен', expired: 'Истёк', cancelled: 'Отменён' }

const CLIENT_SOURCES = [
  { value: '', label: 'Не указан' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'site', label: 'Сайт' },
  { value: 'recommendation', label: 'Рекомендация' },
  { value: 'lead', label: 'Лид' },
  { value: 'call', label: 'Обзвон' },
  { value: 'other', label: 'Другое' },
]

const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram', site: 'Сайт', recommendation: 'Рекомендация',
  lead: 'Лид', call: 'Обзвон', other: 'Другое', manual: 'Вручную', whatsapp: 'WhatsApp',
}

const PRESET_TAGS = ['VIP', 'Пробный', 'Реферал', 'Корпоративный', 'Онлайн']

const TAG_COLORS: Record<string, string> = {
  'VIP': 'var(--color-warning)', 'Пробный': '#3b82f6', 'Реферал': 'var(--color-success)',
  'Корпоративный': '#8b5cf6', 'Онлайн': '#06b6d4',
}

const AVATAR_COLORS = ['var(--accent)', 'var(--color-info)', '#8b5cf6', 'var(--color-warning)', 'var(--color-success)', '#f97316', '#ec4899', '#06b6d4']
function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function tagBg(tag: string, opacity = 9): string {
  const c = TAG_COLORS[tag]
  return c
    ? `color-mix(in srgb, ${c} ${opacity}%, transparent)`
    : `color-mix(in srgb, var(--accent) ${opacity}%, transparent)`
}

function tagBorder(tag: string, opacity = 20): string {
  const c = TAG_COLORS[tag]
  return c
    ? `color-mix(in srgb, ${c} ${opacity}%, transparent)`
    : `color-mix(in srgb, var(--accent) ${opacity}%, transparent)`
}

function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? 'var(--accent)'
}

function getTimeUntilEnd(dateEnd: string): string {
  const now = new Date()
  const end = new Date(dateEnd)
  const diffMs = end.getTime() - now.getTime()
  if (diffMs < 0) return 'Истёк'
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days} дн. ${hours} ч.`
  return `${hours} ч.`
}

function getCountdownColor(dateEnd: string): string {
  const now = new Date()
  const end = new Date(dateEnd)
  const diffMs = end.getTime() - now.getTime()
  if (diffMs < 0) return '#71717A'
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days >= 14) return 'var(--color-success)'
  if (days >= 7)  return 'var(--color-warning)'
  if (days >= 3)  return '#f97316'
  return 'var(--color-danger)'
}

function isTodayBirthday(birthDate: string | null): boolean {
  if (!birthDate) return false
  const bd = new Date(birthDate + 'T00:00:00')
  const now = new Date()
  return bd.getDate() === now.getDate() && bd.getMonth() === now.getMonth()
}

function calcAge(birthDate: string): number {
  const bd = new Date(birthDate + 'T00:00:00')
  const now = new Date()
  let age = now.getFullYear() - bd.getFullYear()
  if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) age--
  return age
}

const inputStyle: React.CSSProperties = {
  height: 36, padding: '0 12px', background: 'transparent',
  border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
}
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }

// ─── ClientModal (create/edit) ────────────────────────────────────────────────

interface ClientModalProps { initial?: Client | null; onClose: () => void; onSave: (c: Client) => void }

function ClientModal({ initial, onClose, onSave }: ClientModalProps) {
  const [fullName,  setFullName]  = useState(initial?.full_name  ?? '')
  const [phone,     setPhone]     = useState(initial?.phone      ?? '')
  const [email,     setEmail]     = useState(initial?.email      ?? '')
  const [birthDate, setBirthDate] = useState(initial?.birth_date ?? '')
  const [notes,     setNotes]     = useState(initial?.notes      ?? '')
  const [source,    setSource]    = useState(initial?.source     ?? '')
  const [tags,      setTags]      = useState<string[]>(initial?.tags ?? [])
  const [tagInput,  setTagInput]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const addTag = (t: string) => {
    const trimmed = t.trim()
    if (trimmed && !tags.includes(trimmed)) setTags(prev => [...prev, trimmed])
    setTagInput('')
  }
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  const handleSubmit = async () => {
    if (!fullName.trim()) { setError('Введите имя клиента'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        full_name:  fullName.trim(),
        phone:      phone.trim()  || null,
        email:      email.trim()  || null,
        birth_date: birthDate     || null,
        notes:      notes.trim()  || null,
        source:     source        || null,
        tags:       tags.length   ? tags : null,
      }
      const result = initial ? await clientsApi.update(initial.id, payload) : await clientsApi.create(payload)
      onSave(result)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{
        position: 'relative', width: '100%', maxWidth: 480,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {initial ? 'Редактировать клиента' : 'Новый клиент'}
            </div>
            {initial && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{initial.full_name}</div>}
          </div>
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
            <input style={inputStyle} placeholder="Фамилия Имя Отчество" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Телефон</label>
              <input style={inputStyle} placeholder="+7 700 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" style={inputStyle} placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Дата рождения</label>
            <input type="date" style={inputStyle} value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Источник</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={source} onChange={e => setSource(e.target.value)}>
              {CLIENT_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Теги</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              {PRESET_TAGS.map(t => (
                <button key={t} type="button" onClick={() => tags.includes(t) ? removeTag(t) : addTag(t)}
                  style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                    border: `1px solid ${tags.includes(t) ? tagBorder(t, 40) : 'var(--border)'}`,
                    background: tags.includes(t) ? tagBg(t, 10) : 'transparent',
                    color: tags.includes(t) ? tagColor(t) : 'var(--text-secondary)',
                    transition: 'background 150ms ease-out, border-color 150ms ease-out',
                  }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{ ...inputStyle, height: 32 }}
                placeholder="Свой тег..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
              />
              <button type="button" onClick={() => addTag(tagInput)}
                style={{ height: 32, padding: '0 12px', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', borderRadius: 8, color: 'var(--accent)', fontSize: 13, cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>+</button>
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                {tags.map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, background: tagBg(t, 10), border: `1px solid ${tagBorder(t, 25)}`, color: tagColor(t) }}>
                    {t}<button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit', opacity: 0.7 }}><X size={9} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Заметки</label>
            <textarea
              style={{ ...inputStyle, height: 72, paddingTop: 8, paddingBottom: 8, resize: 'vertical' }}
              placeholder="Дополнительная информация..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => void handleSubmit()} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
              {saving ? 'Сохранение...' : initial ? 'Сохранить' : 'Добавить клиента'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SubProgressBar ───────────────────────────────────────────────────────────

function SubProgressBar({ used, total, color }: { used: number; total: number | null; color: string }) {
  if (!total) return null
  const pct = Math.min(100, Math.round((used / total) * 100))
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Использовано</span>
        <span style={{ fontSize: 10, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{used}/{total}</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 300ms ease-out' }} />
      </div>
    </div>
  )
}

// ─── ClientDetailModal ────────────────────────────────────────────────────────

type DetailTab = 'profile' | 'visits' | 'subs' | 'history' | 'chat'

const CANCELLATION_REASONS = [
  { value: 'changed_mind', label: 'Клиент передумал' },
  { value: 'moving',       label: 'Переезд' },
  { value: 'finances',     label: 'Финансы' },
  { value: 'health',       label: 'Здоровье' },
  { value: 'other',        label: 'Другое' },
]

interface ClientDetailModalProps {
  client: Client
  onClose: () => void
  onEdit: () => void
  onSellSub: () => void
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  create_from_lead:   'Создан из лида',
  cancel_subscription: 'Абонемент отменён',
  cancel_booking:     'Бронь снята',
  create_booking:     'Бронь создана',
  reschedule_booking: 'Бронь перенесена',
}

interface ClientMsg { id: string; sender: string; text: string; created_at: string; is_read: boolean }

function ClientDetailModal({ client, onClose, onEdit, onSellSub }: ClientDetailModalProps) {
  const { user } = useAuth()
  const [tab,             setTab]          = useState<DetailTab>('profile')
  const [detail,          setDetail]       = useState<ClientDetail | null>(null)
  const [loadingDetail,   setLoadingDetail] = useState(true)
  const [auditLog,        setAuditLog]     = useState<AuditLogEntry[] | null>(null)
  const [loadingAudit,    setLoadAudit]    = useState(false)
  const [messages,        setMessages]     = useState<ClientMsg[] | null>(null)
  const [msgText,         setMsgText]      = useState('')
  const [sendingMsg,      setSendingMsg]   = useState(false)
  const [clientToken,     setClientToken]  = useState<string | null>(null)
  const [tokenLoading,    setTokenLoading] = useState(false)
  const [showQR,          setShowQR]       = useState(false)
  const [copied,          setCopied]       = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null)

  const canManage = user?.role === 'developer' || user?.role === 'owner' || user?.role === 'franchisee'

  const [freezeSubTarget, setFreezeSubTarget] = useState<Subscription | null>(null)
  const [cancelSubId,     setCancelSubId]     = useState<string | null>(null)
  const [renewalsTarget,  setRenewalsTarget]  = useState<Subscription | null>(null)
  const [showFreezeClient, setShowFreezeClient] = useState(false)

  const loadDetail = useCallback(async () => {
    setLoadingDetail(true)
    try {
      const d = await clientsApi.getById(client.id)
      setDetail(d)
    } catch {
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [client.id])

  useEffect(() => { void loadDetail() }, [loadDetail])

  const loadAuditLog = useCallback(() => {
    if (auditLog !== null || loadingAudit) return
    setLoadAudit(true)
    api.get('/audit-log', { params: { entity_id: client.id } })
      .then(res => setAuditLog((res.data as AuditLogEntry[]) ?? []))
      .catch(() => setAuditLog([]))
      .finally(() => setLoadAudit(false))
  }, [client.id, auditLog, loadingAudit])

  useEffect(() => {
    if (tab === 'history') loadAuditLog()
  }, [tab, loadAuditLog])

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get(`/client-messages/${client.id}`)
      setMessages((res.data as ClientMsg[]) ?? [])
    } catch { setMessages([]) }
  }, [client.id])

  useEffect(() => {
    if (tab === 'chat') void loadMessages()
  }, [tab, loadMessages])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMsg = async () => {
    if (!msgText.trim() || sendingMsg) return
    setSendingMsg(true)
    try {
      await api.post(`/client-messages/${client.id}`, { text: msgText.trim() })
      setMsgText('')
      await loadMessages()
    } finally { setSendingMsg(false) }
  }

  const handleGetToken = async () => {
    if (clientToken) return
    setTokenLoading(true)
    try {
      const res = await api.post(`/clients/${client.id}/portal-token`)
      setClientToken((res.data as { token: string }).token)
    } catch { /* ignore */ } finally { setTokenLoading(false) }
  }

  const portalUrl = clientToken ? `${window.location.origin}/client/${clientToken}` : ''

  const handleCopy = () => {
    if (!portalUrl) return
    navigator.clipboard.writeText(portalUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const handleUnfreezeSub = async (subId: string) => {
    try {
      await subscriptionsApi.unfreeze(subId)
      await loadDetail()
    } catch { /* ignore */ }
  }

  const currentClient = detail ?? client
  const subs        = detail?.subscriptions ?? []
  const bookings    = detail?.bookings      ?? []
  const leadCmts    = detail?.lead_comments ?? []
  const activeSubs  = subs.filter(s => s.status === 'active')
  const pastSubs    = subs.filter(s => s.status !== 'active')

  const totalVisits    = bookings.length
  const attendedVisits = bookings.filter(b => b.attended).length
  const lastVisit      = bookings[0]?.date ?? null
  const totalSpent     = subs.reduce((acc, s) => acc + (s.price ?? 0), 0)
  const activeSubEnd   = activeSubs[0]?.date_end ?? null

  const initials = client.full_name.charAt(0).toUpperCase()
  const isFrozen = currentClient.status === 'frozen'

  const tabBtn = (t: DetailTab, label: string, icon: React.ReactNode) => (
    <button onClick={() => setTab(t)} style={{
      flex: 1, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      background: tab === t ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
      border: 'none', borderRadius: 7,
      color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
      fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
      transition: 'background 150ms ease-out, color 150ms ease-out',
    }}>
      {icon}{label}
    </button>
  )

  return (
    <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{
        position: 'relative', width: '100%', maxWidth: 540,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>

        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: isFrozen ? 'color-mix(in srgb, var(--color-info) 12%, transparent)' : 'color-mix(in srgb, var(--accent) 12%, transparent)',
              border: `2px solid ${isFrozen ? 'color-mix(in srgb, var(--color-info) 30%, transparent)' : 'color-mix(in srgb, var(--accent) 30%, transparent)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700,
              color: isFrozen ? 'var(--color-info)' : 'var(--accent)',
            }}>
              {isFrozen ? <Snowflake size={20} /> : initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                {client.full_name}
                {isFrozen && (
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'color-mix(in srgb, var(--color-info) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-info) 25%, transparent)', color: 'var(--color-info)' }}>
                    Заморожен
                  </span>
                )}
              </div>
              {client.phone && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{client.phone}</div>}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                В базе с {new Date(client.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                {isFrozen && currentClient.freeze_until && ` · заморожен до ${new Date(currentClient.freeze_until + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => { void handleGetToken(); setTab('profile') }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', transition: 'border-color 150ms ease-out' }}>
                <Link size={12} />Кабинет
              </button>
              <button onClick={onEdit}
                style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', transition: 'border-color 150ms ease-out' }}>
                <Edit2 size={12} />Изменить
              </button>
              <button onClick={onClose} className="icon-btn"><X size={16} /></button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card)', borderRadius: 9, padding: 3 }}>
            {tabBtn('profile', 'Профиль',   <Eye size={12} />)}
            {tabBtn('visits',  'Визиты',    <CheckCircle2 size={12} />)}
            {tabBtn('subs',    'Абонем.',   <CreditCard size={12} />)}
            {tabBtn('history', 'История',   <FileText size={12} />)}
            {tabBtn('chat',    'Чат',       <MessageCircle size={12} />)}
          </div>
        </div>

        {loadingDetail && (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[80, 60, 100, 70].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 6 }} />
            ))}
          </div>
        )}

        {/* Profile tab */}
        {!loadingDetail && tab === 'profile' && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 460, overflowY: 'auto' }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { val: totalVisits, label: 'Визитов', color: 'var(--accent)' },
                { val: activeSubs.length, label: 'Активных', color: 'var(--color-success)' },
                { val: lastVisit ? new Date(lastVisit + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—', label: 'Посл. визит', color: 'var(--text)' },
                { val: totalSpent > 0 ? totalSpent.toLocaleString('ru-RU') : '—', label: 'Потрачено ₸', color: 'var(--text)' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {activeSubEnd && (() => {
              const countdown = getTimeUntilEnd(activeSubEnd)
              const cdColor = getCountdownColor(activeSubEnd)
              const isExpired = countdown === 'Истёк'
              const isUrgent = !isExpired && cdColor === 'var(--color-danger)'
              return (
                <div style={{ padding: '8px 12px', background: 'color-mix(in srgb, var(--color-success) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 20%, transparent)', borderRadius: 8, fontSize: 12, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Clock size={12} />
                  Активный абонемент до {new Date(activeSubEnd + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                    background: `color-mix(in srgb, ${cdColor} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${cdColor} 30%, transparent)`,
                    color: cdColor,
                    animation: isUrgent ? 'pulse 1.5s ease-in-out infinite' : undefined,
                    flexShrink: 0,
                  }}>
                    {isExpired ? 'Истёк' : `⏱ ${countdown}`}
                  </span>
                </div>
              )
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {client.phone && (
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Телефон</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={12} color="var(--text-muted)" />{client.phone}
                  </div>
                </div>
              )}
              {client.email && (
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={12} color="var(--text-muted)" />{client.email}
                  </div>
                </div>
              )}
              {client.birth_date && (
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Дата рождения</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={12} color="var(--text-muted)" />
                    {new Date(client.birth_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({calcAge(client.birth_date)} лет)</span>
                  </div>
                </div>
              )}
              {client.source && (
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Источник</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{SOURCE_LABELS[client.source] ?? client.source}</div>
                </div>
              )}
            </div>

            {client.notes && (
              <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Заметки</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{client.notes}</div>
              </div>
            )}
            {client.tags && client.tags.length > 0 && (
              <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Теги</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {client.tags.map(t => (
                    <span key={t} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: tagBg(t, 10), border: `1px solid ${tagBorder(t, 25)}`, color: tagColor(t) }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <button onClick={onSellSub}
                style={{ flex: 1, minWidth: 140, height: 34, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', borderRadius: 8, color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 150ms ease-out' }}>
                <CreditCard size={13} />Продать абонемент
              </button>
              {canManage && !isFrozen && (
                <button onClick={() => setShowFreezeClient(true)}
                  style={{ height: 34, padding: '0 12px', background: 'color-mix(in srgb, var(--color-info) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-info) 25%, transparent)', borderRadius: 8, color: 'var(--color-info)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Snowflake size={13} />Заморозить
                </button>
              )}
              {canManage && isFrozen && (
                <button onClick={async () => { await clientsApi.unfreeze(client.id); await loadDetail() }}
                  style={{ height: 34, padding: '0 12px', background: 'color-mix(in srgb, var(--color-success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)', borderRadius: 8, color: 'var(--color-success)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={13} />Разморозить
                </button>
              )}
            </div>
          </div>
        )}

        {/* Visits tab */}
        {!loadingDetail && tab === 'visits' && (
          <div style={{ padding: 24, maxHeight: 460, overflowY: 'auto' }}>
            {bookings.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <CheckCircle2 size={24} strokeWidth={1.5} />
                <span>Визитов пока нет</span>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {attendedVisits} из {totalVisits} посещено
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {bookings.map((b: ClientBooking) => {
                    const deviceLabel = b.slot?.device ? DEVICE_TYPE_LABELS[b.slot.device.type] ?? b.slot.device.type : null
                    const timeLabel   = b.slot ? `${b.slot.time_start.slice(0, 5)}–${b.slot.time_end.slice(0, 5)}` : null
                    const attended = b.attended
                    const statusColor = attended ? 'var(--color-success)' : attended === false ? 'var(--color-danger)' : '#71717A'
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `color-mix(in srgb, ${statusColor} 10%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircle2 size={14} color={statusColor} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                            {new Date(b.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                            {timeLabel && <span>{timeLabel}</span>}
                            {deviceLabel && <span>· {deviceLabel} {b.slot?.device?.number && `#${b.slot.device.number}`}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: `color-mix(in srgb, ${statusColor} 10%, transparent)`, color: statusColor, border: `1px solid color-mix(in srgb, ${statusColor} 25%, transparent)` }}>
                          {attended ? 'Посетил' : attended === false ? 'Не пришёл' : 'Запись'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Subscriptions tab */}
        {!loadingDetail && tab === 'subs' && (
          <div style={{ padding: 24, maxHeight: 460, overflowY: 'auto' }}>
            {subs.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <CreditCard size={24} strokeWidth={1.5} />
                <span>Абонементов нет</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeSubs.length > 0 && (
                  <div className="section-label" style={{ marginBottom: 4 }}>Активные</div>
                )}
                {activeSubs.map(sub => (
                  <SubCard key={sub.id} sub={sub}
                    onDelete={canManage ? () => setCancelSubId(sub.id) : undefined}
                    onFreeze={canManage ? setFreezeSubTarget : undefined}
                    onUnfreeze={canManage ? (id) => void handleUnfreezeSub(id) : undefined}
                    onShowRenewals={setRenewalsTarget}
                  />
                ))}
                {pastSubs.length > 0 && (
                  <div className="section-label" style={{ marginTop: 8, marginBottom: 4 }}>Прошлые</div>
                )}
                {pastSubs.map(sub => (
                  <SubCard key={sub.id} sub={sub}
                    onDelete={canManage ? () => setCancelSubId(sub.id) : undefined}
                    onShowRenewals={setRenewalsTarget}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {!loadingDetail && tab === 'history' && (
          <div style={{ padding: 24, maxHeight: 460, overflowY: 'auto' }}>
            {(loadingAudit && leadCmts.length === 0) ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Загрузка...</div>
            ) : (auditLog?.length === 0 && leadCmts.length === 0) ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <History size={24} strokeWidth={1.5} />
                <span>История пуста</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {leadCmts.length > 0 && (
                  <>
                    <div className="section-label" style={{ marginBottom: 4 }}>Комментарии менеджеров</div>
                    {leadCmts.map(c => (
                      <div key={c.id} style={{ padding: '10px 12px', background: 'color-mix(in srgb, var(--accent) 4%, transparent)', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{c.text}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                          {new Date(c.created_at).toLocaleDateString('ru-RU')}
                          {c.profiles?.full_name && ` · ${c.profiles.full_name}`}
                        </div>
                      </div>
                    ))}
                    {(auditLog ?? []).length > 0 && <div className="section-label" style={{ marginTop: 8, marginBottom: 4 }}>Действия</div>}
                  </>
                )}
                {(auditLog ?? []).map(entry => {
                  const d = new Date(entry.created_at)
                  const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                  const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                  const actionLabel = AUDIT_ACTION_LABELS[entry.action] ?? entry.action
                  return (
                    <div key={entry.id} style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{actionLabel}</div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{timeStr}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        {dateStr}{entry.actor_name ? ` · ${entry.actor_name}` : ''}
                      </div>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                          {JSON.stringify(entry.details)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Chat tab */}
        {!loadingDetail && tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 460 }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { void handleGetToken() }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 7, color: 'var(--accent)', fontSize: 11, cursor: 'pointer' }}>
                <Link size={11} />{tokenLoading ? 'Генерация...' : 'Ссылка кабинета'}
              </button>
              {clientToken && (
                <>
                  <button onClick={handleCopy}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: copied ? 'var(--color-success)' : 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>
                    <Copy size={11} />{copied ? 'Скопировано!' : 'Копировать'}
                  </button>
                  <button onClick={() => setShowQR(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>
                    <QrCode size={11} />QR
                  </button>
                </>
              )}
            </div>
            {showQR && clientToken && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
                <div style={{ padding: 12, background: '#fff', borderRadius: 12, display: 'inline-block' }}>
                  <QRCodeSVG value={portalUrl} size={160} />
                </div>
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
              {messages === null && <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: 20 }}>Загрузка...</div>}
              {messages?.length === 0 && <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: 20 }}>Сообщений пока нет</div>}
              {messages?.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'manager' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '8px 12px', fontSize: 13, lineHeight: 1.4,
                    borderRadius: m.sender === 'manager' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.sender === 'manager' ? 'var(--accent)' : 'var(--bg-surface)',
                    color: m.sender === 'manager' ? 'var(--accent-fg)' : 'var(--text)',
                    border: m.sender === 'manager' ? 'none' : '1px solid var(--border)',
                  }}>
                    {m.sender === 'client' && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Клиент</div>}
                    {m.text}
                    <div style={{ fontSize: 10, color: m.sender === 'manager' ? 'color-mix(in srgb, var(--accent-fg) 60%, transparent)' : 'var(--text-muted)', marginTop: 3, textAlign: 'right' }}>
                      {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, height: 36, padding: '0 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                placeholder="Написать клиенту..."
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSendMsg() } }}
              />
              <button onClick={() => void handleSendMsg()} disabled={!msgText.trim() || sendingMsg}
                style={{ width: 36, height: 36, background: msgText.trim() ? 'var(--accent)' : 'transparent', border: msgText.trim() ? 'none' : '1px solid var(--border)', borderRadius: 8, cursor: msgText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms ease-out' }}>
                <Send size={14} color={msgText.trim() ? '#fff' : 'var(--text-muted)'} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>

    {freezeSubTarget && (
      <FreezeModal
        sub={freezeSubTarget}
        onClose={() => setFreezeSubTarget(null)}
        onFrozen={async () => { setFreezeSubTarget(null); await loadDetail() }}
      />
    )}
    {cancelSubId && (
      <CancelSubModal
        subId={cancelSubId}
        onClose={() => setCancelSubId(null)}
        onCancelled={async () => { setCancelSubId(null); setAuditLog(null); await loadDetail() }}
      />
    )}
    {renewalsTarget && (
      <RenewalsModal sub={renewalsTarget} onClose={() => setRenewalsTarget(null)} />
    )}
    {showFreezeClient && (
      <FreezeClientModal
        client={client}
        onClose={() => setShowFreezeClient(false)}
        onFrozen={async () => { setShowFreezeClient(false); await loadDetail() }}
      />
    )}
    </>
  )
}

interface SubCardProps {
  sub: Subscription
  onDelete?: () => void
  onFreeze?: (sub: Subscription) => void
  onUnfreeze?: (id: string) => void
  onShowRenewals?: (sub: Subscription) => void
}

function SubCard({ sub, onDelete, onFreeze, onUnfreeze, onShowRenewals }: SubCardProps) {
  const sc = SUB_STATUS_COLOR[sub.status]
  const frozenLabel = sub.status === 'frozen' && sub.frozen_until
    ? `До ${new Date(sub.frozen_until + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
    : null

  return (
    <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 12, border: `1px solid color-mix(in srgb, ${sc} 15%, transparent)` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sub.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `color-mix(in srgb, ${sc} 10%, transparent)`, color: sc, border: `1px solid color-mix(in srgb, ${sc} 25%, transparent)` }}>
            {frozenLabel ?? SUB_STATUS_LABEL[sub.status]}
          </span>
          {onFreeze && sub.status === 'active' && (
            <button onClick={() => onFreeze(sub)} title="Заморозить" className="icon-btn" style={{ width: 22, height: 22, fontSize: 10 }}>❄</button>
          )}
          {onUnfreeze && sub.status === 'frozen' && (
            <button onClick={() => onUnfreeze(sub.id)} title="Разморозить" className="icon-btn" style={{ width: 22, height: 22, fontSize: 10 }}>☀</button>
          )}
          {onShowRenewals && (
            <button onClick={() => onShowRenewals(sub)} title="История продлений" className="icon-btn" style={{ width: 22, height: 22 }}>
              <History size={11} />
            </button>
          )}
          {onDelete && sub.status !== 'cancelled' && (
            <button onClick={onDelete} title="Отменить абонемент" className="icon-btn" style={{ width: 22, height: 22, color: 'var(--color-danger)' }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Слот 1 — {DEVICE_TYPE_LABELS[sub.slot_1_type]}</div>
          <SubProgressBar used={sub.slot_1_sessions_total - sub.slot_1_sessions_left} total={sub.slot_1_sessions_total} color={DEVICE_TYPE_COLORS[sub.slot_1_type]} />
          <div style={{ fontSize: 11, color: DEVICE_TYPE_COLORS[sub.slot_1_type], marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
            {sub.slot_1_sessions_left} из {sub.slot_1_sessions_total} осталось
          </div>
        </div>
        {sub.slot_2_type && sub.slot_2_sessions_left !== null && sub.slot_2_sessions_total !== null && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Слот 2 — {DEVICE_TYPE_LABELS[sub.slot_2_type]}</div>
            <SubProgressBar used={sub.slot_2_sessions_total - sub.slot_2_sessions_left} total={sub.slot_2_sessions_total} color={DEVICE_TYPE_COLORS[sub.slot_2_type]} />
            <div style={{ fontSize: 11, color: DEVICE_TYPE_COLORS[sub.slot_2_type], marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
              {sub.slot_2_sessions_left} из {sub.slot_2_sessions_total} осталось
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span>С {new Date(sub.date_start).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
        {sub.date_end && (
          <>
            <span>По {new Date(sub.date_end).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {sub.status === 'active' && (() => {
              const countdown = getTimeUntilEnd(sub.date_end)
              const cdColor = getCountdownColor(sub.date_end)
              const isUrgent = cdColor === 'var(--color-danger)' && countdown !== 'Истёк'
              return (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                  background: `color-mix(in srgb, ${cdColor} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${cdColor} 30%, transparent)`,
                  color: cdColor,
                  animation: isUrgent ? 'pulse 1.5s ease-in-out infinite' : undefined,
                }}>
                  {countdown === 'Истёк' ? 'Истёк' : `⏱ ${countdown}`}
                </span>
              )
            })()}
          </>
        )}
        {sub.price != null && <span>· {sub.price.toLocaleString('ru-RU')} ₸</span>}
        {sub.cancellation_reason && <span>· Причина: {CANCELLATION_REASONS.find(r => r.value === sub.cancellation_reason)?.label ?? sub.cancellation_reason}</span>}
      </div>
    </div>
  )
}

// ─── FreezeModal ─────────────────────────────────────────────────────────────

function FreezeModal({ sub, onClose, onFrozen }: { sub: Subscription; onClose: () => void; onFrozen: () => void }) {
  const today = new Date()
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 30)
  const [frozenUntil, setFrozenUntil] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (!frozenUntil) { setError('Выберите дату окончания заморозки'); return }
    setSaving(true); setError(null)
    try {
      await subscriptionsApi.freeze(sub.id, frozenUntil)
      onFrozen()
    } catch { setError('Ошибка при заморозке') } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Заморозить абонемент</div>
          <button onClick={onClose} className="icon-btn"><X size={15} /></button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{sub.name}</div>
        {error && <div style={{ fontSize: 12, color: 'var(--color-danger)', marginBottom: 12, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', borderRadius: 8 }}>{error}</div>}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Заморозить до (макс. 30 дней)</label>
          <input type="date" style={inputStyle}
            min={today.toISOString().split('T')[0]}
            max={maxDate.toISOString().split('T')[0]}
            value={frozenUntil}
            onChange={e => setFrozenUntil(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => void handle()} disabled={saving}
            style={{ flex: 1, height: 36, background: 'var(--color-warning)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'opacity 150ms' }}>
            {saving ? 'Заморозка...' : 'Заморозить'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ─── CancelSubModal ───────────────────────────────────────────────────────────

function CancelSubModal({ subId, onClose, onCancelled }: { subId: string; onClose: () => void; onCancelled: () => void }) {
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true)
    try {
      await subscriptionsApi.patch(subId, { status: 'cancelled', cancellation_reason: reason || undefined })
      onCancelled()
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Причина отмены</div>
          <button onClick={onClose} className="icon-btn"><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {CANCELLATION_REASONS.map(r => (
            <button key={r.value} onClick={() => setReason(r.value)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: reason === r.value ? 'color-mix(in srgb, var(--color-danger) 8%, transparent)' : 'transparent',
              border: `1px solid ${reason === r.value ? 'color-mix(in srgb, var(--color-danger) 35%, transparent)' : 'var(--border)'}`,
              borderRadius: 8, color: reason === r.value ? 'var(--color-danger)' : 'var(--text-secondary)',
              fontSize: 13, cursor: 'pointer', textAlign: 'left',
              transition: 'background 150ms ease-out, border-color 150ms ease-out',
            }}>
              {r.label}
            </button>
          ))}
          <textarea style={{ ...inputStyle, height: 60, paddingTop: 8, paddingBottom: 8, resize: 'none' }} placeholder="Комментарий (необязательно)..." value={comment} onChange={e => setComment(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => void handle()} disabled={saving}
            style={{ flex: 1, height: 36, background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)', borderRadius: 8, color: 'var(--color-danger)', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Отмена...' : 'Отменить абонемент'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">Закрыть</button>
        </div>
      </div>
    </div>
  )
}

// ─── RenewalsModal ────────────────────────────────────────────────────────────

function RenewalsModal({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  const [renewals, setRenewals] = useState<SubscriptionRenewal[] | null>(null)
  useEffect(() => {
    subscriptionsApi.getRenewals(sub.id)
      .then(setRenewals)
      .catch(() => setRenewals([]))
  }, [sub.id])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 480, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>История продлений · {sub.name}</div>
          <button onClick={onClose} className="icon-btn"><X size={15} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {renewals === null ? (
            <div style={{ textAlign: 'center', padding: 32, fontSize: 13, color: 'var(--text-muted)' }}>Загрузка...</div>
          ) : renewals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, fontSize: 13, color: 'var(--text-muted)' }}>История продлений пуста</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {renewals.map(r => (
                <div key={r.id} style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.profiles?.full_name ?? '—'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {r.old_date_end && <span>Было до: {new Date(r.old_date_end).toLocaleDateString('ru-RU')} → </span>}
                    {r.new_date_end && <span>Стало до: {new Date(r.new_date_end).toLocaleDateString('ru-RU')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── FreezeClientModal ───────────────────────────────────────────────────────

function FreezeClientModal({ client, onClose, onFrozen }: { client: Client; onClose: () => void; onFrozen: () => void }) {
  const today = new Date()
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 90)
  const [freezeUntil, setFreezeUntil] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (!freezeUntil) { setError('Выберите дату окончания заморозки'); return }
    setSaving(true); setError(null)
    try {
      await clientsApi.freeze(client.id, freezeUntil)
      onFrozen()
    } catch { setError('Ошибка при заморозке клиента') } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
      <div className="modal-animate" style={{ position: 'relative', width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Заморозить клиента</div>
          <button onClick={onClose} className="icon-btn"><X size={15} /></button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{client.full_name}</div>
        {error && <div style={{ fontSize: 12, color: 'var(--color-danger)', marginBottom: 12, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', borderRadius: 8 }}>{error}</div>}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Заморозить до (макс. 90 дней)</label>
          <input type="date" style={inputStyle}
            min={today.toISOString().split('T')[0]}
            max={maxDate.toISOString().split('T')[0]}
            value={freezeUntil}
            onChange={e => setFreezeUntil(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => void handle()} disabled={saving}
            style={{ flex: 1, height: 36, background: 'color-mix(in srgb, var(--color-info) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--color-info) 30%, transparent)', borderRadius: 8, color: 'var(--color-info)', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Snowflake size={13} />{saving ? 'Заморозка...' : 'Заморозить'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ─── Table constants & types ──────────────────────────────────────────────────

type PageTab = 'clients' | 'subscriptions' | 'services'
type SortField = 'full_name' | 'ltv' | 'renewal_probability' | 'date_end' | 'created_at'
type ColumnKey = 'phone' | 'status' | 'ltv' | 'subscription' | 'date_end' | 'renewal' | 'manager'

const ALL_COLS: ColumnKey[] = ['phone', 'status', 'ltv', 'subscription', 'date_end', 'renewal', 'manager']
const COLUMN_LABELS: Record<ColumnKey, string> = {
  phone: 'Телефон', status: 'Статус', ltv: 'LTV', subscription: 'Абонемент',
  date_end: 'Действует до', renewal: 'Продление', manager: 'Менеджер',
}
const COLUMN_WIDTHS: Record<ColumnKey, string> = {
  phone: '140px', status: '90px', ltv: '100px', subscription: '160px',
  date_end: '95px', renewal: '95px', manager: '130px',
}
const COL_SORT: Partial<Record<ColumnKey, SortField>> = {
  ltv: 'ltv', date_end: 'date_end', renewal: 'renewal_probability',
}

const CLIENT_STATUS_LABELS: Record<string, string> = {
  new_client: 'Новый', active: 'Активный', frozen: 'Заморожен',
  expiring_soon: 'Истекает', not_renewed: 'Не продлил',
}
const CLIENT_STATUS_COLORS: Record<string, string> = {
  new_client: 'var(--color-info)', active: 'var(--color-success)',
  frozen: '#06b6d4', expiring_soon: '#f97316', not_renewed: 'var(--color-danger)',
}

interface ClientFilterState {
  status: string; manager_id: string; tags: string[]; source: string
  age_from: string; age_to: string; reg_from: string; reg_to: string
  last_visit_from: string; last_visit_to: string
  min_ltv: string; max_ltv: string; min_renewal: string; max_renewal: string
  is_frozen: boolean
}
const EMPTY_FILTERS: ClientFilterState = {
  status: '', manager_id: '', tags: [], source: '',
  age_from: '', age_to: '', reg_from: '', reg_to: '',
  last_visit_from: '', last_visit_to: '',
  min_ltv: '', max_ltv: '', min_renewal: '', max_renewal: '',
  is_frozen: false,
}

function filtersHasActive(f: ClientFilterState): boolean {
  return !!(f.status || f.manager_id || f.tags.length || f.source ||
    f.age_from || f.age_to || f.reg_from || f.reg_to ||
    f.last_visit_from || f.last_visit_to ||
    f.min_ltv || f.max_ltv || f.min_renewal || f.max_renewal || f.is_frozen)
}

function filtersToParams(f: ClientFilterState) {
  return {
    ...(f.status           && { status: f.status }),
    ...(f.manager_id       && { manager_id: f.manager_id }),
    ...(f.tags.length      && { tags: f.tags.join(',') }),
    ...(f.source           && { source: f.source }),
    ...(f.age_from         && { age_from: Number(f.age_from) }),
    ...(f.age_to           && { age_to: Number(f.age_to) }),
    ...(f.reg_from         && { from: f.reg_from }),
    ...(f.reg_to           && { to: f.reg_to }),
    ...(f.last_visit_from  && { last_visit_from: f.last_visit_from }),
    ...(f.last_visit_to    && { last_visit_to: f.last_visit_to }),
    ...(f.min_ltv          && { min_ltv: Number(f.min_ltv) }),
    ...(f.max_ltv          && { max_ltv: Number(f.max_ltv) }),
    ...(f.min_renewal      && { min_renewal: Number(f.min_renewal) }),
    ...(f.max_renewal      && { max_renewal: Number(f.max_renewal) }),
    ...(f.is_frozen        && { is_frozen: true }),
  }
}

function buildGrid(cols: ColumnKey[]): string {
  return ['40px', '1fr', ...ALL_COLS.filter(c => cols.includes(c)).map(c => COLUMN_WIDTHS[c]), '50px'].join(' ')
}

// ─── RenewalBar ───────────────────────────────────────────────────────────────

function RenewalBar({ probability }: { probability: number }) {
  const color = getRenewalColor(probability)
  return (
    <div>
      <div style={{ height: 3, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', marginBottom: 3 }}>
        <div style={{ height: '100%', width: `${probability}%`, background: color, borderRadius: 4, transition: 'width 300ms ease-out' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{probability}%</span>
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = CLIENT_STATUS_COLORS[status] ?? 'var(--text-muted)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
      color,
    }}>
      {CLIENT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ─── FiltersPanel ────────────────────────────────────────────────────────────

interface FiltersPanelProps {
  filters: ClientFilterState
  managers: { id: string; name: string }[]
  onChange: (f: ClientFilterState) => void
  onApply: () => void
  onReset: () => void
}

function FiltersPanel({ filters, managers, onChange, onApply, onReset }: FiltersPanelProps) {
  const set = <K extends keyof ClientFilterState>(k: K, v: ClientFilterState[K]) =>
    onChange({ ...filters, [k]: v })
  const toggleTag = (t: string) =>
    set('tags', filters.tags.includes(t) ? filters.tags.filter(x => x !== t) : [...filters.tags, t])

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
        <div>
          <label style={labelStyle}>Статус</label>
          <select style={{ ...inputStyle, height: 34 }} value={filters.status} onChange={e => set('status', e.target.value)}>
            <option value="">Все статусы</option>
            {Object.entries(CLIENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Источник</label>
          <select style={{ ...inputStyle, height: 34 }} value={filters.source} onChange={e => set('source', e.target.value)}>
            {CLIENT_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        {managers.length > 0 && (
          <div>
            <label style={labelStyle}>Менеджер</label>
            <select style={{ ...inputStyle, height: 34 }} value={filters.manager_id} onChange={e => set('manager_id', e.target.value)}>
              <option value="">Все менеджеры</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={labelStyle}>Возраст</label>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <input type="number" min={0} max={120} style={{ ...inputStyle, height: 34 }} placeholder="От" value={filters.age_from} onChange={e => set('age_from', e.target.value)} />
            <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>—</span>
            <input type="number" min={0} max={120} style={{ ...inputStyle, height: 34 }} placeholder="До" value={filters.age_to} onChange={e => set('age_to', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Дата регистрации</label>
          <div style={{ display: 'flex', gap: 5 }}>
            <input type="date" style={{ ...inputStyle, height: 34 }} value={filters.reg_from} onChange={e => set('reg_from', e.target.value)} />
            <input type="date" style={{ ...inputStyle, height: 34 }} value={filters.reg_to} onChange={e => set('reg_to', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Последний визит</label>
          <div style={{ display: 'flex', gap: 5 }}>
            <input type="date" style={{ ...inputStyle, height: 34 }} value={filters.last_visit_from} onChange={e => set('last_visit_from', e.target.value)} />
            <input type="date" style={{ ...inputStyle, height: 34 }} value={filters.last_visit_to} onChange={e => set('last_visit_to', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>LTV (₸)</label>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <input type="number" min={0} style={{ ...inputStyle, height: 34 }} placeholder="От" value={filters.min_ltv} onChange={e => set('min_ltv', e.target.value)} />
            <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>—</span>
            <input type="number" min={0} style={{ ...inputStyle, height: 34 }} placeholder="До" value={filters.max_ltv} onChange={e => set('max_ltv', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Вероятность продления (%)</label>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <input type="number" min={0} max={100} style={{ ...inputStyle, height: 34 }} placeholder="От" value={filters.min_renewal} onChange={e => set('min_renewal', e.target.value)} />
            <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>—</span>
            <input type="number" min={0} max={100} style={{ ...inputStyle, height: 34 }} placeholder="До" value={filters.max_renewal} onChange={e => set('max_renewal', e.target.value)} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Теги:</span>
          {PRESET_TAGS.map(t => (
            <button key={t} type="button" onClick={() => toggleTag(t)} style={{
              padding: '3px 9px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              border: `1px solid ${filters.tags.includes(t) ? tagBorder(t, 40) : 'var(--border)'}`,
              background: filters.tags.includes(t) ? tagBg(t, 10) : 'transparent',
              color: filters.tags.includes(t) ? tagColor(t) : 'var(--text-secondary)',
              transition: 'background 150ms ease-out, border-color 150ms ease-out',
            }}>{t}</button>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 4 }}>
            <input type="checkbox" checked={filters.is_frozen} onChange={e => set('is_frozen', e.target.checked)}
              style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
            Только замороженные
          </label>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {filtersHasActive(filters) && (
            <button onClick={onReset} style={{ height: 32, padding: '0 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <X size={12} />Сбросить
            </button>
          )}
          <button onClick={onApply} className="btn btn-primary" style={{ height: 32, fontSize: 12, padding: '0 16px' }}>
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ColumnPickerDropdown ────────────────────────────────────────────────────

function ColumnPickerDropdown({ visibleCols, onChange, onClose }: {
  visibleCols: ColumnKey[]
  onChange: (cols: ColumnKey[]) => void
  onClose: () => void
}) {
  const toggle = (col: ColumnKey) => {
    onChange(visibleCols.includes(col) ? visibleCols.filter(c => c !== col) : [...visibleCols, col])
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
      <div style={{
        position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 50,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 5, minWidth: 160,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}>
        {ALL_COLS.map(col => (
          <button key={col} onClick={() => toggle(col)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '7px 10px', background: 'transparent', border: 'none',
            borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text)', textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
              border: `1.5px solid ${visibleCols.includes(col) ? 'var(--accent)' : 'var(--border)'}`,
              background: visibleCols.includes(col) ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 100ms ease-out, border-color 100ms ease-out',
            }}>
              {visibleCols.includes(col) && <Check size={9} color="var(--accent-fg)" strokeWidth={3} />}
            </div>
            {COLUMN_LABELS[col]}
          </button>
        ))}
      </div>
    </>
  )
}

// ─── ClientTableRow ───────────────────────────────────────────────────────────

interface ClientTableRowProps {
  client: Client
  gridTemplate: string
  visibleCols: ColumnKey[]
  selected: boolean
  onSelect: (id: string, selected: boolean) => void
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

function ClientTableRow({ client, gridTemplate, visibleCols, selected, onSelect, onClick, onEdit, onDelete }: ClientTableRowProps) {
  const initials   = client.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const color      = avatarColor(client.full_name)
  const isBirthday = isTodayBirthday(client.birth_date ?? null)
  const renewal    = client.renewal_probability ?? 0
  const sub        = client.active_subscription

  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center',
        borderBottom: '1px solid var(--border)', minHeight: 52, cursor: 'pointer',
        background: selected ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : 'transparent',
        transition: 'background 100ms ease-out',
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--border) 30%, transparent)' }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {/* Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={e => { e.stopPropagation(); onSelect(client.id, !selected) }}>
        <div style={{
          width: 15, height: 15, borderRadius: 3,
          border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
          background: selected ? 'var(--accent)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 100ms ease-out, border-color 100ms ease-out', cursor: 'pointer',
        }}>
          {selected && <Check size={9} color="var(--accent-fg)" strokeWidth={3} />}
        </div>
      </div>

      {/* Name + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 8, overflow: 'hidden' }} onClick={onClick}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1.5px solid color-mix(in srgb, ${color} 25%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color,
        }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.full_name}
            </span>
            {isBirthday && <span title="День рождения!" style={{ fontSize: 12, flexShrink: 0 }}>🎂</span>}
          </div>
          {client.tags && client.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
              {client.tags.slice(0, 2).map(t => (
                <span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 10, background: tagBg(t, 10), border: `1px solid ${tagBorder(t, 25)}`, color: tagColor(t), flexShrink: 0 }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optional columns — order must match ALL_COLS */}
      {visibleCols.includes('phone') && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }} onClick={onClick}>
          {client.phone ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </div>
      )}
      {visibleCols.includes('status') && (
        <div onClick={onClick}>
          {client.status ? <StatusBadge status={client.status} /> : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
        </div>
      )}
      {visibleCols.includes('ltv') && (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }} onClick={onClick}>
          {client.ltv ? `${client.ltv.toLocaleString('ru-RU')} ₸` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </div>
      )}
      {visibleCols.includes('subscription') && (
        <div style={{ overflow: 'hidden', paddingRight: 8 }} onClick={onClick}>
          {sub ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 4 }}>
                <span style={{ color: DEVICE_TYPE_COLORS[sub.slot_1_type] ?? 'var(--accent)' }}>{DEVICE_TYPE_LABELS[sub.slot_1_type] ?? sub.slot_1_type}</span>
                {sub.slot_2_type && <span style={{ color: DEVICE_TYPE_COLORS[sub.slot_2_type] ?? 'var(--text-muted)' }}>+{DEVICE_TYPE_LABELS[sub.slot_2_type] ?? sub.slot_2_type}</span>}
              </div>
            </>
          ) : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
        </div>
      )}
      {visibleCols.includes('date_end') && (
        <div style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }} onClick={onClick}>
          {sub?.date_end
            ? <span style={{ color: getCountdownColor(sub.date_end) }}>
                {new Date(sub.date_end + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </div>
      )}
      {visibleCols.includes('renewal') && (
        <div style={{ paddingRight: 8 }} onClick={onClick}>
          {renewal > 0 ? <RenewalBar probability={renewal} /> : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
        </div>
      )}
      {visibleCols.includes('manager') && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }} onClick={onClick}>
          {client.manager_name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <button onClick={e => { e.stopPropagation(); onEdit() }} className="icon-btn" title="Изменить" style={{ width: 26, height: 26 }}>
          <Edit2 size={12} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="icon-btn" title="Удалить" style={{ width: 26, height: 26, color: 'var(--color-danger)' }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── SubTableRow ─────────────────────────────────────────────────────────────

function SubTableRow({ client, onClick }: { client: Client; onClick: () => void }) {
  const sub      = client.active_subscription!
  const initials = client.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const color    = avatarColor(client.full_name)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 170px 110px 80px 100px 90px',
        alignItems: 'center', borderBottom: '1px solid var(--border)', minHeight: 52, cursor: 'pointer',
        transition: 'background 100ms ease-out',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--border) 30%, transparent)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', paddingRight: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1.5px solid color-mix(in srgb, ${color} 25%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color,
        }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.full_name}</div>
          {client.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{client.phone}</div>}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
        {sub.name}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <span style={{ color: DEVICE_TYPE_COLORS[sub.slot_1_type] ?? 'var(--accent)' }}>{DEVICE_TYPE_LABELS[sub.slot_1_type] ?? sub.slot_1_type}</span>
        {sub.slot_2_type && <><br /><span style={{ color: DEVICE_TYPE_COLORS[sub.slot_2_type] ?? 'var(--text-muted)' }}>{DEVICE_TYPE_LABELS[sub.slot_2_type] ?? sub.slot_2_type}</span></>}
      </div>
      <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text)', fontWeight: 600 }}>
        {sub.slot_1_sessions_left}
        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/{sub.slot_1_sessions_total ?? '∞'}</span>
      </div>
      <div style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
        {sub.date_end
          ? <span style={{ color: getCountdownColor(sub.date_end) }}>
              {new Date(sub.date_end + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })}
            </span>
          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </div>
      <div>
        {sub.status && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 20,
            fontSize: 10, fontWeight: 600,
            background: `color-mix(in srgb, ${SUB_STATUS_COLOR[sub.status] ?? '#71717A'} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${SUB_STATUS_COLOR[sub.status] ?? '#71717A'} 25%, transparent)`,
            color: SUB_STATUS_COLOR[sub.status] ?? '#71717A',
          }}>
            {SUB_STATUS_LABEL[sub.status] ?? sub.status}
          </span>
        )}
      </div>
    </div>
  )
}

interface ClientRowProps { client: Client; onClick: () => void; onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void }

function ClientRow({ client, onClick, onContextMenu }: ClientRowProps) {
  const activeSub = client.memberships?.find((m: import('../../types').ClientMembership) => m.status === 'active')
  const isBirthday = isTodayBirthday(client.birth_date ?? null)
  const color    = avatarColor(client.full_name)
  const initials = client.full_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="table-row"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `2px solid color-mix(in srgb, ${color} 25%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        fontSize: 13, fontWeight: 700, color,
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {client.full_name}
          </span>
          {isBirthday && (
            <span title="День рождения сегодня!" style={{ fontSize: 13, flexShrink: 0 }}>🎂</span>
          )}
          {client.tags && client.tags.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: tagBg(t, 10), border: `1px solid ${tagBorder(t, 25)}`, color: tagColor(t), flexShrink: 0 }}>
              {t}
            </span>
          ))}
          {activeSub && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 6, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)', flexShrink: 0 }}>
              Активный
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {client.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              <Phone size={11} strokeWidth={1.75} />{client.phone}
            </span>
          )}
          {client.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              <Mail size={11} strokeWidth={1.75} />{client.email}
            </span>
          )}
          {client.birth_date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              <Calendar size={11} strokeWidth={1.75} />
              {new Date(client.birth_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </span>
          )}
        </div>
        {activeSub && (
          <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {activeSub.used_sessions} / {activeSub.total_sessions ?? '∞'} сеансов
            {activeSub.end_date && ` · до ${new Date(activeSub.end_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`}
          </div>
        )}
      </div>

      {/* More icon */}
      <div style={{ color: 'var(--text-muted)', opacity: 0.35, flexShrink: 0 }}>
        <MoreVertical size={15} />
      </div>
    </div>
  )
}

// ─── ClientsPage ──────────────────────────────────────────────────────────────

interface CtxMenu { x: number; y: number; client: Client }
const ROWS_OPTIONS = [10, 25, 50]

export default function ClientsPage() {
  const [tab,             setTab]           = useState<PageTab>('clients')
  const [clients,         setClients]       = useState<Client[]>([])
  const [total,           setTotal]         = useState(0)
  const [loading,         setLoading]       = useState(true)
  const [error,           setError]         = useState<string | null>(null)
  const [search,          setSearch]        = useState('')
  const searchTimer                         = useRef<ReturnType<typeof setTimeout>>()
  const [page,            setPage]          = useState(0)
  const [rowsPerPage,     setRowsPerPage]   = useState(25)
  const [sortBy,          setSortBy]        = useState<SortField>('full_name')
  const [sortOrder,       setSortOrder]     = useState<'asc' | 'desc'>('asc')
  const [filters,         setFilters]       = useState<ClientFilterState>(EMPTY_FILTERS)
  const [pendingFilters,  setPendingFilters] = useState<ClientFilterState>(EMPTY_FILTERS)
  const [showFilters,     setShowFilters]   = useState(false)
  const [visibleCols,     setVisibleCols]   = useState<ColumnKey[]>([...ALL_COLS])
  const [showColPicker,   setShowColPicker] = useState(false)
  const [selectedIds,     setSelectedIds]   = useState<Set<string>>(new Set())
  const [showModal,       setShowModal]     = useState(false)
  const [editTarget,      setEditTarget]    = useState<Client | null>(null)
  const [viewTarget,      setViewTarget]    = useState<Client | null>(null)
  const [ctxMenu,         setCtxMenu]       = useState<CtxMenu | null>(null)
  const [managers,        setManagers]      = useState<{ id: string; name: string }[]>([])
  const [subClients,      setSubClients]    = useState<Client[] | null>(null)
  const [subLoading,      setSubLoading]    = useState(false)

  const load = useCallback(async (overrides?: {
    q?: string; pg?: number; rows?: number
    sb?: SortField; so?: 'asc' | 'desc'
    f?: ClientFilterState
  }) => {
    setLoading(true); setError(null)
    const f   = overrides?.f  ?? filters
    const pg  = overrides?.pg ?? page
    const rows = overrides?.rows ?? rowsPerPage
    const sb  = overrides?.sb  ?? sortBy
    const so  = overrides?.so  ?? sortOrder
    const q   = overrides?.q   !== undefined ? overrides.q : search
    try {
      const result = await clientsApi.getAll({
        ...(q && { search: q }),
        limit: rows, offset: pg * rows,
        sort_by: sb, sort_order: so,
        ...filtersToParams(f),
      })
      setClients(result.data)
      setTotal(result.total)
      setManagers(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const toAdd = result.data
          .filter(c => c.manager_id && c.manager_name && !existingIds.has(c.manager_id!))
          .map(c => ({ id: c.manager_id!, name: c.manager_name! }))
        return toAdd.length ? [...prev, ...toAdd] : prev
      })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Не удалось загрузить клиентов')
    } finally {
      setLoading(false)
    }
  }, [filters, page, rowsPerPage, sortBy, sortOrder, search])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (tab !== 'subscriptions' || subClients !== null) return
    setSubLoading(true)
    clientsApi.getAll({ limit: 200, offset: 0, sort_by: 'full_name', sort_order: 'asc' })
      .then(r => setSubClients(r.data.filter(c => c.active_subscription != null)))
      .catch(() => setSubClients([]))
      .finally(() => setSubLoading(false))
  }, [tab, subClients])

  const handleSearch = (q: string) => {
    setSearch(q); setPage(0)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => void load({ q: q || '', pg: 0 }), 400)
  }

  const handleSort = (field: SortField) => {
    const order: 'asc' | 'desc' = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(field); setSortOrder(order); setPage(0)
    void load({ sb: field, so: order, pg: 0 })
  }

  const handleApplyFilters = () => {
    setFilters(pendingFilters); setPage(0)
    void load({ f: pendingFilters, pg: 0 })
  }

  const handleResetFilters = () => {
    setPendingFilters(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); setPage(0)
    void load({ f: EMPTY_FILTERS, pg: 0 })
  }

  const handlePageChange = (p: number) => { setPage(p); void load({ pg: p }) }
  const handleRowsChange = (r: number) => { setRowsPerPage(r); setPage(0); void load({ rows: r, pg: 0 }) }

  const toggleSelect = (id: string, sel: boolean) =>
    setSelectedIds(prev => { const n = new Set(prev); sel ? n.add(id) : n.delete(id); return n })
  const toggleSelectAll = () =>
    setSelectedIds(prev => prev.size === clients.length ? new Set() : new Set(clients.map(c => c.id)))

  const handleExport = async () => {
    const XLSX = await import('xlsx')
    const toExport = selectedIds.size > 0 ? clients.filter(c => selectedIds.has(c.id)) : clients
    const ws = XLSX.utils.json_to_sheet(toExport.map(c => ({
      'Имя': c.full_name, 'Телефон': c.phone ?? '', 'Email': c.email ?? '',
      'Дата рождения': c.birth_date ?? '', 'Теги': (c.tags ?? []).join(', '),
      'Источник': c.source ? (SOURCE_LABELS[c.source] ?? c.source) : '',
      'LTV': c.ltv ?? 0,
      'Статус': CLIENT_STATUS_LABELS[c.status ?? ''] ?? c.status ?? '',
      'Менеджер': c.manager_name ?? '',
      'Вер. продления, %': c.renewal_probability ?? 0,
      'Создан': new Date(c.created_at).toLocaleDateString('ru-RU'),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Клиенты')
    XLSX.writeFile(wb, 'clients.xlsx')
  }

  const handleSave = (c: Client) => {
    if (editTarget) setClients(prev => prev.map(x => x.id === c.id ? c : x))
    else { setClients(prev => [c, ...prev]); setTotal(t => t + 1) }
    setShowModal(false); setEditTarget(null)
  }
  const handleEdit = (c: Client) => { setViewTarget(null); setEditTarget(c); setShowModal(true) }
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить клиента?')) return
    try {
      await clientsApi.delete(id)
      setClients(prev => prev.filter(c => c.id !== id))
      setTotal(t => t - 1)
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Не удалось удалить клиента')
    }
  }
  const handleSellSub = (c: Client) => { setViewTarget(null); window.alert(`Продать абонемент: ${c.full_name}`) }

  const buildCtxItems = (c: Client): ContextMenuEntry[] => [
    { label: 'Открыть карточку',  icon: <Eye size={13} />,       onClick: () => setViewTarget(c) },
    { label: 'Редактировать',     icon: <Edit2 size={13} />,      onClick: () => handleEdit(c) },
    { label: 'Продать абонемент', icon: <CreditCard size={13} />, onClick: () => handleSellSub(c) },
    { separator: true },
    { label: 'Удалить',           icon: <Trash2 size={13} />,     onClick: () => void handleDelete(c.id), danger: true },
  ]

  const gridTemplate = buildGrid(visibleCols)
  const totalPages   = Math.max(1, Math.ceil(total / rowsPerPage))
  const pageStart    = page * rowsPerPage + 1
  const pageEnd      = Math.min((page + 1) * rowsPerPage, total)
  const hasFilters   = filtersHasActive(filters)
  const allSelected  = clients.length > 0 && selectedIds.size === clients.length

  const thCol = (label: string, field?: SortField) => {
    const sorted = field && sortBy === field
    return (
      <div onClick={() => field && handleSort(field)} style={{
        fontSize: 11, fontWeight: 600, paddingLeft: 2,
        color: sorted ? 'var(--accent)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', gap: 3,
        cursor: field ? 'pointer' : 'default', userSelect: 'none',
        transition: 'color 100ms ease-out',
      }}>
        {label}
        {field && (sorted
          ? (sortOrder === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
          : <ChevronUp size={11} style={{ opacity: 0.25 }} />)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Клиенты"
        subtitle={loading ? undefined : `${total.toLocaleString('ru-RU')} клиентов`}
        search={{ value: search, onChange: handleSearch, placeholder: 'Поиск по имени, телефону, email...' }}
        actions={<>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowColPicker(v => !v)} className="btn btn-secondary" style={{ gap: 6, height: 36 }}>
              <Settings2 size={14} />Колонки
            </button>
            {showColPicker && (
              <ColumnPickerDropdown visibleCols={visibleCols} onChange={setVisibleCols} onClose={() => setShowColPicker(false)} />
            )}
          </div>
          <button
            onClick={() => { setShowFilters(v => !v); if (!showFilters) setPendingFilters(filters) }}
            className="btn btn-secondary"
            style={{ gap: 6, height: 36, ...(hasFilters && { borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', color: 'var(--accent)' }) }}
          >
            <SlidersHorizontal size={14} />Фильтры
            {hasFilters && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: 20 }}>
                {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : Boolean(v)).length}
              </span>
            )}
          </button>
          <button onClick={() => void handleExport()} className="btn btn-secondary" style={{ gap: 6, height: 36 }}>
            <Download size={14} />Excel{selectedIds.size > 0 && ` (${selectedIds.size})`}
          </button>
          <button onClick={() => { setEditTarget(null); setShowModal(true) }} className="btn btn-primary" style={{ gap: 6, height: 36 }}>
            <Plus size={15} strokeWidth={2.5} />Клиент
          </button>
        </>}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
        {(['clients', 'subscriptions', 'services'] as PageTab[]).map(t => {
          const labels: Record<PageTab, string> = { clients: 'Клиенты', subscriptions: 'Абонементы', services: 'Услуги' }
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              height: 36, padding: '0 16px', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
              transition: 'color 150ms ease-out, border-color 150ms ease-out',
              marginBottom: -1,
            }}>{labels[t]}</button>
          )
        })}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <FiltersPanel
          filters={pendingFilters} managers={managers}
          onChange={setPendingFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)', borderRadius: 8, marginBottom: 10, fontSize: 12, color: 'var(--color-danger)' }}>
          <AlertCircle size={13} />{error}
        </div>
      )}

      {/* ── CLIENTS TAB ── */}
      {tab === 'clients' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center', height: 38, borderBottom: '2px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={toggleSelectAll}>
              <div style={{
                width: 15, height: 15, borderRadius: 3,
                border: `1.5px solid ${selectedIds.size > 0 ? 'var(--accent)' : 'var(--border)'}`,
                background: allSelected ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 100ms ease-out, border-color 100ms ease-out',
              }}>
                {allSelected
                  ? <Check size={9} color="var(--accent-fg)" strokeWidth={3} />
                  : selectedIds.size > 0
                    ? <div style={{ width: 7, height: 1.5, background: 'var(--accent)', borderRadius: 1 }} />
                    : null}
              </div>
            </div>
            {thCol('Имя', 'full_name')}
            {visibleCols.includes('phone')        && thCol('Телефон')}
            {visibleCols.includes('status')       && thCol('Статус')}
            {visibleCols.includes('ltv')          && thCol('LTV', 'ltv')}
            {visibleCols.includes('subscription') && thCol('Абонемент')}
            {visibleCols.includes('date_end')     && thCol('Истекает', 'date_end')}
            {visibleCols.includes('renewal')      && thCol('Продление', 'renewal_probability')}
            {visibleCols.includes('manager')      && thCol('Менеджер')}
            <div />
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: Math.min(rowsPerPage, 10) }).map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center', height: 52, borderBottom: '1px solid var(--border)' }}>
                <div />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 8 }}>
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 11, width: `${45 + (i % 3) * 18}%`, borderRadius: 4, marginBottom: 5 }} />
                    <div className="skeleton" style={{ height: 9, width: '30%', borderRadius: 4 }} />
                  </div>
                </div>
                {ALL_COLS.filter(c => visibleCols.includes(c)).map(c => (
                  <div key={c} className="skeleton" style={{ height: 11, width: '60%', borderRadius: 4 }} />
                ))}
                <div />
              </div>
            ))
          ) : clients.length === 0 ? (
            <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Users size={20} strokeWidth={1.5} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>
                {search || hasFilters ? 'Ничего не найдено' : 'Клиентов пока нет'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.6 }}>
                {search || hasFilters ? 'Попробуйте изменить фильтры' : 'Нажмите «Клиент» чтобы добавить первого'}
              </div>
            </div>
          ) : (
            clients.map(c => (
              <ClientTableRow
                key={c.id} client={c}
                gridTemplate={gridTemplate} visibleCols={visibleCols}
                selected={selectedIds.has(c.id)}
                onSelect={toggleSelect}
                onClick={() => setViewTarget(c)}
                onEdit={() => handleEdit(c)}
                onDelete={() => void handleDelete(c.id)}
              />
            ))
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {pageStart}–{pageEnd} из {total.toLocaleString('ru-RU')}
                {selectedIds.size > 0 && ` · ${selectedIds.size} выбрано`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Строк:</span>
                {ROWS_OPTIONS.map(n => (
                  <button key={n} onClick={() => handleRowsChange(n)} style={{
                    height: 26, padding: '0 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    fontWeight: rowsPerPage === n ? 600 : 400,
                    background: rowsPerPage === n ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                    border: `1px solid ${rowsPerPage === n ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)'}`,
                    color: rowsPerPage === n ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'background 100ms ease-out',
                  }}>{n}</button>
                ))}
                <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
                  <button onClick={() => handlePageChange(page - 1)} disabled={page === 0} className="icon-btn" style={{ opacity: page === 0 ? 0.35 : 1 }}>
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const p = totalPages <= 5 ? i
                      : page <= 2 ? i
                      : page >= totalPages - 3 ? totalPages - 5 + i
                      : page - 2 + i
                    if (p < 0 || p >= totalPages) return null
                    return (
                      <button key={p} onClick={() => handlePageChange(p)} style={{
                        height: 26, minWidth: 26, padding: '0 6px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                        fontWeight: page === p ? 700 : 400,
                        background: page === p ? 'var(--accent)' : 'transparent',
                        border: `1px solid ${page === p ? 'transparent' : 'var(--border)'}`,
                        color: page === p ? 'var(--accent-fg)' : 'var(--text-muted)',
                        transition: 'background 100ms ease-out',
                      }}>{p + 1}</button>
                    )
                  })}
                  <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1} className="icon-btn" style={{ opacity: page >= totalPages - 1 ? 0.35 : 1 }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUBSCRIPTIONS TAB ── */}
      {tab === 'subscriptions' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px 110px 80px 100px 90px', alignItems: 'center', height: 38, borderBottom: '2px solid var(--border)' }}>
            {['Клиент', 'Абонемент', 'Слоты', 'Осталось', 'Истекает', 'Статус'].map(l => (
              <div key={l} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', paddingLeft: 2 }}>{l}</div>
            ))}
          </div>
          {subLoading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Загрузка...</div>
          ) : !(subClients ?? []).length ? (
            <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <CreditCard size={24} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Нет активных абонементов</div>
            </div>
          ) : (
            (subClients ?? []).map(c => (
              <SubTableRow key={c.id} client={c} onClick={() => setViewTarget(c)} />
            ))
          )}
          {!subLoading && (subClients ?? []).length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              {(subClients ?? []).length} клиентов с активными абонементами
            </div>
          )}
        </div>
      )}

      {/* ── SERVICES TAB ── */}
      {tab === 'services' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 260 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'color-mix(in srgb, var(--text-muted) 8%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <FileText size={20} strokeWidth={1.5} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>Услуги</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Раздел в разработке</div>
        </div>
      )}

      {showModal && (
        <ClientModal initial={editTarget} onClose={() => { setShowModal(false); setEditTarget(null) }} onSave={handleSave} />
      )}
      {viewTarget && (
        <ClientDetailModal
          client={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => handleEdit(viewTarget)}
          onSellSub={() => handleSellSub(viewTarget)}
        />
      )}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={buildCtxItems(ctxMenu.client)} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  )
}
