import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase';

@Injectable()
export class DashboardService {
  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private monthStart(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  async activeMemberships() {
    try {
      const { count } = await supabase
        .from('client_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('valid_until', this.today());
      return { count: count ?? 0 };
    } catch {
      return { count: 0 };
    }
  }

  async salesSummary() {
    try {
      const { data: sales } = await supabase
        .from('sales')
        .select('amount')
        .gte('created_at', this.monthStart());

      const { data: settings } = await supabase
        .from('branch_settings')
        .select('monthly_sales_plan')
        .limit(1)
        .single();

      const total = (sales ?? []).reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
      const plan: number = settings?.monthly_sales_plan ?? 0;
      return { total, plan, percent: plan > 0 ? Math.round((total / plan) * 100) : null };
    } catch {
      return { total: 0, plan: 0, percent: null };
    }
  }

  async marketingSummary() {
    try {
      const start = this.monthStart();
      const { count: leadsTotal } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start);

      const { count: converted } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .eq('status', 'converted');

      const total = leadsTotal ?? 0;
      const conv = converted ?? 0;
      return { leads: total, converted: conv, conversion: total > 0 ? Math.round((conv / total) * 100) : 0 };
    } catch {
      return { leads: 0, converted: 0, conversion: 0 };
    }
  }

  async upcomingEvents() {
    try {
      const { data } = await supabase
        .from('events')
        .select('id, title, date, start_time')
        .gte('date', this.today())
        .order('date', { ascending: true })
        .limit(5);
      return data ?? [];
    } catch {
      return [];
    }
  }

  async news() {
    try {
      const { data } = await supabase
        .from('news_posts')
        .select('id, title, content, created_at, profiles(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    } catch {
      return [];
    }
  }

  async topSeller() {
    try {
      const { data } = await supabase
        .from('sales')
        .select('seller_id, amount, profiles(first_name, last_name)')
        .gte('created_at', this.monthStart());

      if (!data?.length) return null;

      const grouped: Record<string, { name: string; total: number }> = {};
      for (const s of data as any[]) {
        const id = s.seller_id;
        if (!grouped[id]) {
          const p = s.profiles;
          grouped[id] = {
            name: `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || 'Неизвестно',
            total: 0,
          };
        }
        grouped[id].total += Number(s.amount) || 0;
      }

      const [sellerId, top] = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total)[0];
      return { seller_id: sellerId, ...top };
    } catch {
      return null;
    }
  }

  async birthdays() {
    try {
      const now = new Date();
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, birth_date')
        .not('birth_date', 'is', null);

      const results: any[] = [];
      for (const p of (profiles ?? []) as any[]) {
        if (!p.birth_date) continue;
        const bd = new Date(p.birth_date);
        const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        const diffMs = thisYear.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          results.push({ ...p, days_until: diffDays });
        }
      }

      return results.sort((a, b) => a.days_until - b.days_until);
    } catch {
      return [];
    }
  }
}
