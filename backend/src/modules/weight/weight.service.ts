import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeightRecord } from './weight.entity';
import { CreateWeightDto } from './dto/create-weight.dto';

@Injectable()
export class WeightService {
  constructor(
    @InjectRepository(WeightRecord)
    private readonly repo: Repository<WeightRecord>,
  ) {}

  findAll(userId: string): Promise<WeightRecord[]> {
    return this.repo.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  create(userId: string, dto: CreateWeightDto): Promise<WeightRecord> {
    const record = this.repo.create({ userId, ...dto });
    return this.repo.save(record);
  }

  async delete(id: string, userId: string): Promise<void> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException();
    if (record.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(record);
  }
}
