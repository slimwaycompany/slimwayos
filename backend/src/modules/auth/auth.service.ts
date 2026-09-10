import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { supabase, createUserClient } from '../../config/supabase';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';

interface Profile {
  id: string;
  full_name: string;
  is_developer: boolean;
  must_change_password: boolean;
  branch_id: string | null;
  created_at?: string;
}

function randomPassword(len = 10): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

@Injectable()
export class AuthService {
  async login(dto: LoginDto) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });
    if (error || !data.session) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const profile = await this.getProfile(data.user.id);
    return {
      session: data.session,
      must_change_password: profile?.must_change_password ?? true,
      is_developer: profile?.is_developer ?? false,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: dto.new_password,
    });
    if (error) throw new UnauthorizedException(error.message);

    await supabase
      .from('profiles')
      .update({ must_change_password: false, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return { success: true };
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const tempPassword = randomPassword();

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: dto.email,
      password: tempPassword,
      email_confirm: true,
    });
    if (createError || !authData.user) {
      throw new Error(createError?.message ?? 'Не удалось создать пользователя');
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: dto.full_name,
      is_developer: false,
      must_change_password: true,
      branch_id: dto.branch_id ?? null,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(profileError.message);
    }

    return {
      user_id: authData.user.id,
      email: dto.email,
      temp_password: tempPassword,
    };
  }

  async resetPassword(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (!profile) throw new NotFoundException('Пользователь не найден');

    const tempPassword = randomPassword();
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });
    if (error) throw new Error(error.message);

    await supabase
      .from('profiles')
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return { temp_password: tempPassword };
  }

  async listEmployees() {
    const [{ data: authUsersData }, { data: profiles }] = await Promise.all([
      supabase.auth.admin.listUsers(),
      supabase.from('profiles').select('*').order('created_at'),
    ]);

    const profileMap = new Map(
      ((profiles as Profile[]) ?? []).map((p) => [p.id, p]),
    );

    return ((authUsersData?.users ?? []) as { id: string; email?: string }[])
      .filter((u) => profileMap.has(u.id))
      .map((u) => ({ id: u.id, email: u.email ?? '', ...profileMap.get(u.id) }));
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, is_developer, must_change_password, branch_id')
      .eq('id', userId)
      .maybeSingle<Profile>();
    return data;
  }

  async logout(accessToken: string) {
    try {
      const userClient = createUserClient(accessToken);
      await userClient.auth.signOut();
    } catch {
      // best-effort: invalidate session on Supabase side
    }
    return { success: true };
  }

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const profile = await this.getProfile(id);
    return profile as Record<string, unknown> | null;
  }
}
