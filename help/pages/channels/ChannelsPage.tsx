import React, { useState, useEffect, useCallback } from 'react'
import {
  Camera, Music2, Send, Phone, PlayCircle,
  Plus, X, ExternalLink, Edit2, Trash2, AlertCircle, Radio,
} from 'lucide-react'
import { channelsApi, type Channel, type ChannelPlatform, type ChannelPayload } from '../../api/channels.api'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePermissions } from '../../hooks/usePermissions'

// ─── Platform config ────────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<ChannelPlatform, { label: string; icon: React.ReactNode; color: string }> = {
  instagram: { label: 'Instagram', icon: <Camera size={18} />,     color: 'var(--color-danger)' },
  tiktok:    { label: 'TikTok',    icon: <Music2 size={18} />,     color: 'var(--text)' },
  telegram:  { label: 'Telegram',  icon: <Send size={18} />,       color: 'var(--color-info)' },
  whatsapp:  { label: 'WhatsApp',  icon: <Phone size={18} />,      color: 'var(--color-success)' },
  youtube:   { label: 'YouTube',   icon: <PlayCircle size={18} />, color: 'var(--color-danger)' },
}

const PLATFORMS = Object.keys(PLATFORM_CONFIG) as ChannelPlatform[]

// ─── ChannelModal ───────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  height: 36, padding: '0 12px', background: 'transparent',
  border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
  fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color 150ms ease-out',
}
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }

interface ChannelModalProps {
  initial?: Channel | null
  onClose: () => void
  onSave: (c: Channel) => void
}

function ChannelModal({ initial, onClose, onSave }: ChannelModalProps) {
  const [platform,    setPlatform]    = useState<ChannelPlatform>(initial?.platform ?? 'instagram')
  const [name,        setName]        = useState(initial?.name ?? '')
  const [url,         setUrl]         = useState(initial?.url ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Введите название канала'); return }
    if (!url.trim()) { setError('Введите ссылку на канал'); return }
    setSaving(true); setError(null)
    try {
      const payload: ChannelPayload = { platform, name: name.trim(), url: url.trim(), description: description.trim() || undefined }
      const result = initial ? await channelsApi.update(initial.id, payload) : await channelsApi.create(payload)
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
        position: 'relative', width: '100%', maxWidth: 460,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {initial ? 'Редактировать канал' : 'Добавить канал'}
          </div>
          <button onClick={onClose} className="icon-btn"><X size={16} /></button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--color-danger)' }}>
            <AlertCircle size={13} />{error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Платформа</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLATFORMS.map(p => {
                const cfg = PLATFORM_CONFIG[p]
                const active = platform === p
                return (
                  <button key={p} type="button" onClick={() => setPlatform(p)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px',
                    background: active ? `color-mix(in srgb, ${cfg.color} 10%, transparent)` : 'transparent',
                    border: `1px solid ${active ? `color-mix(in srgb, ${cfg.color} 40%, transparent)` : 'var(--border)'}`,
                    borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
                    color: active ? cfg.color : 'var(--text-muted)',
                    transition: 'background 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out',
                  }}>
                    {cfg.icon}{cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Название *</label>
            <input style={inputStyle} placeholder="Например: Slimway Official" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Ссылка *</label>
            <input style={inputStyle} placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Описание</label>
            <textarea
              style={{ ...inputStyle, height: 68, paddingTop: 8, paddingBottom: 8, resize: 'vertical' }}
              placeholder="Краткое описание канала..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => void handleSubmit()} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
              {saving ? 'Сохранение...' : initial ? 'Сохранить' : 'Добавить'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ChannelCard ────────────────────────────────────────────────────────────────

interface ChannelCardProps {
  channel: Channel
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}

function ChannelCard({ channel, canEdit, onEdit, onDelete }: ChannelCardProps) {
  const cfg = PLATFORM_CONFIG[channel.platform]
  const color = cfg?.color ?? 'var(--accent)'

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 150ms ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `color-mix(in srgb, ${color} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {cfg?.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{channel.name}</div>
            <div style={{ fontSize: 11, color, marginTop: 1, fontWeight: 500 }}>{cfg?.label}</div>
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={onEdit} className="icon-btn" title="Редактировать"><Edit2 size={13} /></button>
            <button onClick={onDelete} className="icon-btn" title="Удалить" style={{ color: 'var(--color-danger)' }}><Trash2 size={13} /></button>
          </div>
        )}
      </div>

      {channel.description && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{channel.description}</div>
      )}

      <a
        href={channel.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
          color: color, textDecoration: 'none',
          padding: '5px 10px', borderRadius: 7,
          background: `color-mix(in srgb, ${color} 6%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 18%, transparent)`,
          transition: 'background 150ms ease-out',
          alignSelf: 'flex-start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        <ExternalLink size={11} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {channel.url.replace(/^https?:\/\//, '')}
        </span>
      </a>
    </div>
  )
}

// ─── ChannelsPage ────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const perm = usePermissions()
  const canEdit = perm.can('management', 'edit')
  const [channels,    setChannels]    = useState<Channel[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<ChannelPlatform | ''>('')
  const [showModal,   setShowModal]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<Channel | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setChannels(await channelsApi.getAll())
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Не удалось загрузить каналы')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleSave = (c: Channel) => {
    if (editTarget) setChannels(prev => prev.map(x => x.id === c.id ? c : x))
    else setChannels(prev => [c, ...prev])
    setShowModal(false); setEditTarget(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить канал?')) return
    try {
      await channelsApi.delete(id)
      setChannels(prev => prev.filter(c => c.id !== id))
    } catch { /* ignore */ }
  }

  const filtered = filterPlatform ? channels.filter(c => c.platform === filterPlatform) : channels

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <PageHeader
        title="Каналы"
        subtitle={`${filtered.length} ${filtered.length === 1 ? 'канал' : 'каналов'}`}
        filters={<>
          <button
            onClick={() => setFilterPlatform('')}
            style={{
              height: 30, padding: '0 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${filterPlatform === '' ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--border)'}`,
              background: filterPlatform === '' ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
              color: filterPlatform === '' ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'background 150ms ease-out, border-color 150ms ease-out',
            }}>
            Все
          </button>
          {PLATFORMS.map(p => {
            const cfg = PLATFORM_CONFIG[p]
            const active = filterPlatform === p
            return (
              <button key={p} onClick={() => setFilterPlatform(active ? '' : p)} style={{
                height: 30, padding: '0 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                border: `1px solid ${active ? `color-mix(in srgb, ${cfg.color} 40%, transparent)` : 'var(--border)'}`,
                background: active ? `color-mix(in srgb, ${cfg.color} 8%, transparent)` : 'transparent',
                color: active ? cfg.color : 'var(--text-muted)',
                transition: 'background 150ms ease-out, border-color 150ms ease-out',
              }}>
                {cfg.icon}{cfg.label}
              </button>
            )
          })}
        </>}
        actions={canEdit ? <>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true) }}
            className="btn btn-primary"
            style={{ gap: 6 }}
          >
            <Plus size={15} strokeWidth={2.5} />Добавить канал
          </button>
        </> : undefined}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)', borderRadius: 8, marginBottom: 12, fontSize: 12, color: 'var(--color-danger)' }}>
          <AlertCircle size={13} />{error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 260 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Radio size={22} strokeWidth={1.5} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' }}>
            {filterPlatform ? `Нет каналов для ${PLATFORM_CONFIG[filterPlatform].label}` : 'Каналов пока нет'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.6 }}>
            {canEdit ? 'Нажмите «Добавить канал» чтобы добавить первый' : 'Каналы появятся после настройки в разделе Управления'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map(c => (
            <ChannelCard
              key={c.id}
              channel={c}
              canEdit={canEdit}
              onEdit={() => { setEditTarget(c); setShowModal(true) }}
              onDelete={() => void handleDelete(c.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ChannelModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
