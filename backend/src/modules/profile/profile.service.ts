import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase';
import { UpdateProfileDto } from './dto/update-profile.dto';

const ALLOWED_KEYS: (keyof UpdateProfileDto)[] = [
  'first_name', 'last_name', 'middle_name', 'birth_date',
  'position', 'department', 'bio', 'photo_url',
  'theme_bg_color', 'theme_font_color',
];

@Injectable()
export class ProfileService {
  async getFullProfile(userId: string) {
    const [{ data: profile }, { data: achievements }, { data: subordinates }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('achievements').select('*').eq('user_id', userId).order('achieved_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, first_name, last_name').eq('manager_id', userId),
    ]);

    let manager = null;
    if (profile && (profile as Record<string, unknown>).manager_id) {
      const { data: mgr } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name')
        .eq('id', (profile as Record<string, unknown>).manager_id)
        .single();
      manager = mgr;
    }

    return { ...profile, achievements: achievements ?? [], subordinates: subordinates ?? [], manager };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ALLOWED_KEYS) {
      if (dto[key] !== undefined) patch[key] = dto[key];
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}
