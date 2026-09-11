/*
 * Run in Supabase SQL Editor manually:
 *
 * CREATE TABLE IF NOT EXISTS bp_attendance (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   status text NOT NULL DEFAULT 'mark',
 *   branch text, employee_name text, recorded_at timestamptz,
 *   is_replacement boolean DEFAULT false, replaces_name text,
 *   comment text, latitude double precision, longitude double precision,
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE TABLE IF NOT EXISTS bp_zrs (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   status text NOT NULL DEFAULT 'new',
 *   from_employee_name text, goal text, amount numeric(12,2),
 *   description text, finance_date date,
 *   created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
 * );
 * CREATE TABLE IF NOT EXISTS bp_supplies (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   status text NOT NULL DEFAULT 'new',
 *   from_employee_name text, needed_date date, items jsonb DEFAULT '[]',
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE TABLE IF NOT EXISTS bp_shift_open (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   status text NOT NULL DEFAULT 'not_done',
 *   shift_date date, cash_register numeric(12,2), cash_report numeric(12,2),
 *   has_discrepancy boolean DEFAULT false, discrepancy_comment text,
 *   given_by_name text, received_by_name text,
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE TABLE IF NOT EXISTS bp_shift_close (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   status text NOT NULL DEFAULT 'not_done',
 *   shift_date date, cash_register numeric(12,2), cash_report numeric(12,2),
 *   cash_terminal numeric(12,2), cash_discrepancy boolean DEFAULT false, cash_comment text,
 *   card_terminal numeric(12,2), card_report numeric(12,2),
 *   card_discrepancy boolean DEFAULT false, card_comment text,
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE TABLE IF NOT EXISTS bp_checklist (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   status text NOT NULL DEFAULT 'new',
 *   checklist_date date, shift_info text, items jsonb DEFAULT '{}',
 *   created_at timestamptz DEFAULT now()
 * );
 */

import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase';

@Injectable()
export class BusinessProcessesService {
  /* ── Attendance ─────────────────────────────────────────────────────────── */

  async getAttendance() {
    try {
      const { data, error } = await supabase
        .from('bp_attendance')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  }

  async createAttendance(dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_attendance')
      .insert({ ...dto, status: 'mark' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async patchAttendance(id: string, dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_attendance')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  /* ── ZRS ────────────────────────────────────────────────────────────────── */

  async getZrs(dateFrom?: string, dateTo?: string, employee?: string) {
    try {
      let query = supabase
        .from('bp_zrs')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
      if (employee) query = query.ilike('from_employee_name', `%${employee}%`);

      const { data, error } = await query;
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  }

  async createZrs(dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_zrs')
      .insert({ ...dto, status: 'new' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async patchZrs(id: string, dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_zrs')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  /* ── Supplies ───────────────────────────────────────────────────────────── */

  async getSupplies() {
    try {
      const { data, error } = await supabase
        .from('bp_supplies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  }

  async createSupplies(dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_supplies')
      .insert({ ...dto, status: 'new' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async patchSupplies(id: string, dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_supplies')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  /* ── Shift Open ─────────────────────────────────────────────────────────── */

  async getShiftOpen() {
    try {
      const { data, error } = await supabase
        .from('bp_shift_open')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  }

  async createShiftOpen(dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_shift_open')
      .insert({ ...dto, status: 'not_done' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async patchShiftOpen(id: string, dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_shift_open')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  /* ── Shift Close ────────────────────────────────────────────────────────── */

  async getShiftClose() {
    try {
      const { data, error } = await supabase
        .from('bp_shift_close')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  }

  async createShiftClose(dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_shift_close')
      .insert({ ...dto, status: 'not_done' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async patchShiftClose(id: string, dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_shift_close')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  /* ── Checklist ──────────────────────────────────────────────────────────── */

  async getChecklist() {
    try {
      const { data, error } = await supabase
        .from('bp_checklist')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  }

  async createChecklist(dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_checklist')
      .insert({ ...dto, status: 'new' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async patchChecklist(id: string, dto: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bp_checklist')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}
