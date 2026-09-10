import { BarChart2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'

export default function AnalyticsPage() {
  return (
    <div style={{ padding: '24px' }}>
      <PageHeader title="Отчёты" />
      <div style={{
        marginTop: 24,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}>
        <BarChart2 size={40} strokeWidth={1.25} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Аналитика и отчёты</div>
        <div style={{ fontSize: 13 }}>Раздел в разработке</div>
      </div>
    </div>
  )
}
