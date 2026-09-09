import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase';

@Injectable()
export class BranchSettingsService {
  async getSettings() {
    const { data } = await supabase
      .from('branch_settings')
      .select('*')
      .limit(1)
      .single();
    return data ?? { monthly_sales_plan: 0 };
  }

  async updateSettings(dto: Record<string, unknown>) {
    const { data: existing } = await supabase
      .from('branch_settings')
      .select('id')
      .limit(1)
      .single();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('branch_settings')
        .update(dto)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await supabase
        .from('branch_settings')
        .insert(dto)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
  }
}
