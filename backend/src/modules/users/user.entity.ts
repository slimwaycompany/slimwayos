import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  COACH = 'coach',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true, name: 'height_cm' })
  heightCm?: number;

  @Column({ nullable: true, name: 'birth_date', type: 'date' })
  birthDate?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true, name: 'target_weight_kg', type: 'decimal', precision: 5, scale: 2 })
  targetWeightKg?: number;

  @Column({ nullable: true, name: 'activity_level' })
  activityLevel?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
