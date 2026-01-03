import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn } from 'typeorm';
import { Family } from './family.entity';

export enum HubretStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISSOLVED = 'dissolved'
}

@Entity('hubrets')
export class Hubret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  hubretId: string; // e.g., HUB-0001

  @Column()
  hubretNameAmharic: string; // ህብረት ስም

  @Column()
  hubretNameEnglish: string;

  @Column({
    type: 'varchar',
    default: HubretStatus.ACTIVE,
  })
  status: HubretStatus;

  // Hubret Leader Information
  @Column({ nullable: true })
  leaderMemberId?: string;

  // Contact Information
  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  // Location Information
  @Column({ nullable: true })
  region?: string;

  @Column({ nullable: true })
  zone?: string;

  @Column({ nullable: true })
  woreda?: string;

  @Column({ nullable: true })
  kebele?: string;

  @Column({ type: 'int', default: 0 })
  totalFamilies: number;

  @Column({ type: 'int', default: 0 })
  totalMembers: number;

  @Column({ type: 'int', default: 0 })
  activeMembers: number;

  @Column({ nullable: true })
  notes?: string;

  // Relationships
  @OneToMany(() => Family, family => family.hubret)
  families: Family[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy?: string; // User ID

  @Column({ nullable: true })
  updatedBy?: string; // User ID
}
