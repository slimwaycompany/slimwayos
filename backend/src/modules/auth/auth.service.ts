import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .maybeSingle();

    if (existing) throw new ConflictException('Email уже зарегистрирован');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name: dto.name, email: dto.email, password_hash: passwordHash })
      .select('id, name, email, role')
      .single();

    if (error) throw new Error(error.message);

    return { accessToken: this.sign(user as UserRow), user };
  }

  async login(dto: LoginDto) {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, role, password_hash')
      .eq('email', dto.email)
      .maybeSingle<UserRow>();

    if (!user) throw new UnauthorizedException('Неверный email или пароль');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Неверный email или пароль');

    const { password_hash: _omit, ...safeUser } = user;
    return { accessToken: this.sign(user), user: safeUser };
  }

  async findById(id: string): Promise<Omit<UserRow, 'password_hash'> | null> {
    const { data } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', id)
      .maybeSingle();
    return data;
  }

  private sign(user: Pick<UserRow, 'id' | 'email'>): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
