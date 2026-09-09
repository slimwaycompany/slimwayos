import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: User }> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });
    const accessToken = this.sign(user);
    return { accessToken, user };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Неверный email или пароль');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Неверный email или пароль');
    return { accessToken: this.sign(user), user };
  }

  private sign(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
