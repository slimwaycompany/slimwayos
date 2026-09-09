import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  async findAll() {
    const { data, error } = await supabase
      .from('shifts')
      .select('*, profiles(first_name, last_name, middle_name)')
      .order('date', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async findMy(userId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async create(dto: CreateShiftDto) {
    const { data, error } = await supabase.from('shifts').insert(dto).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, dto: UpdateShiftDto) {
    const { data, error } = await supabase
      .from('shifts')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string) {
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}
