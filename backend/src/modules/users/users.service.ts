import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async create(data: Pick<User, 'name' | 'email' | 'passwordHash'>): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email уже зарегистрирован');
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }
}
