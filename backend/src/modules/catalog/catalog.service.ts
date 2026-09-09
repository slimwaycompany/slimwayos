import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { supabase } from '../../config/supabase';

const TABLE_MAP: Record<string, string> = {
  'promo-codes':        'promo_codes',
  'membership-types':   'membership_types',
  'products':           'products',
  'payment-methods':    'payment_methods',
  'legal-entities':     'legal_entities',
  'devices':            'devices',
  'device-slots':       'device_slots',
  'lead-sources':       'lead_sources',
  'document-templates': 'document_templates',
  'decline-reasons':    'decline_reasons',
};

@Injectable()
export class CatalogService {
  private table(entity: string): string {
    const t = TABLE_MAP[entity];
    if (!t) throw new BadRequestException(`Unknown entity: ${entity}`);
    return t;
  }

  async list(entity: string) {
    const { data, error } = await supabase
      .from(this.table(entity))
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async create(entity: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from(this.table(entity))
      .insert(body)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(entity: string, id: string, body: Record<string, unknown>) {
    const { data, error } = await supabase
      .from(this.table(entity))
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException();
    return data;
  }

  async remove(entity: string, id: string) {
    const { error } = await supabase.from(this.table(entity)).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}
