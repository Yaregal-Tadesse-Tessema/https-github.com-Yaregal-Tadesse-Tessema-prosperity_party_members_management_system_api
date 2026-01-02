import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  PARTY_ADMIN = 'party_admin',
  FINANCE_OFFICER = 'finance_officer',
  DATA_ENTRY_OFFICER = 'data_entry_officer',
  READ_ONLY_VIEWER = 'read_only_viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  fullName: string;

  @Column({
    type: 'varchar',
    default: UserRole.DATA_ENTRY_OFFICER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt?: Date;
}
