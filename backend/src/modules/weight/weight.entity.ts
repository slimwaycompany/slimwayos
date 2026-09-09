import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('weight_records')
export class WeightRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'weight_kg' })
  weightKg: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
