import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeightRecord } from './weight.entity';
import { WeightService } from './weight.service';
import { WeightController } from './weight.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WeightRecord])],
  providers: [WeightService],
  controllers: [WeightController],
})
export class WeightModule {}
