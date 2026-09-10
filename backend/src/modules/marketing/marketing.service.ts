import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase';

@Injectable()
export class MarketingService {
  async getClientSources() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('source')
        .not('source', 'is', null);

      if (error || !data) return [];

      const counts: Record<string, number> = {};
      for (const row of data) {
        const src = (row.source as string) || 'other';
        counts[src] = (counts[src] ?? 0) + 1;
      }

      return Object.entries(counts).map(([source, count]) => ({ source, count }));
    } catch {
      return [];
    }
  }

  async getConversions() {
    try {
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      const { count: totalTrials } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('status', ['trial', 'converted']);

      const { count: totalPurchases } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted');

      const leads     = totalLeads     ?? 0;
      const trials    = totalTrials    ?? 0;
      const purchases = totalPurchases ?? 0;

      return {
        lead_to_trial:      leads     > 0 ? (trials    / leads)     * 100 : 0,
        trial_to_purchase:  trials    > 0 ? (purchases / trials)    * 100 : 0,
        total_leads:        leads,
        total_trials:       trials,
        total_purchases:    purchases,
      };
    } catch {
      return { lead_to_trial: 0, trial_to_purchase: 0, total_leads: 0, total_trials: 0, total_purchases: 0 };
    }
  }

  async getSpend() {
    try {
      const { data, error } = await supabase
        .from('marketing_spend')
        .select('channel, amount, leads')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  async saveSpend(channel: string, amount: number, leads: number) {
    try {
      const { error } = await supabase
        .from('marketing_spend')
        .insert({ channel, amount, leads });

      if (error) throw error;
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async getSalesByPeriod(from: string, to: string) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('amount, payment_method')
        .gte('created_at', from)
        .lte('created_at', to + 'T23:59:59');

      if (error || !data) return { total: 0, cash: 0, card: 0, count: 0 };

      let cash = 0, card = 0;
      for (const row of data) {
        const amt = Number(row.amount) || 0;
        if ((row.payment_method as string) === 'cash') cash += amt;
        else card += amt;
      }

      return { total: cash + card, cash, card, count: data.length };
    } catch {
      return { total: 0, cash: 0, card: 0, count: 0 };
    }
  }
}
