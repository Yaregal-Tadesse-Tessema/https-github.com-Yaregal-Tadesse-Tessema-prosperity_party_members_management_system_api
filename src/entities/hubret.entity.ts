import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Family } from './family.entity';
import { Member } from './member.entity';

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

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'leaderMemberId' })
  leader?: Member;

  // Sector Heads (Member relations)
  @Column({ nullable: true })
  politicalSectorHeadMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'politicalSectorHeadMemberId' })
  politicalSectorHead?: Member;

  @Column({ nullable: true })
  organizationSectorHeadMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'organizationSectorHeadMemberId' })
  organizationSectorHead?: Member;

  @Column({ nullable: true })
  financeSectorHeadMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'financeSectorHeadMemberId' })
  financeSectorHead?: Member;

  @Column({ nullable: true })
  mediaSectorHeadMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'mediaSectorHeadMemberId' })
  mediaSectorHead?: Member;

  // Deputy Sector Heads (Member relations)
  @Column({ nullable: true })
  deputyPoliticalSectorHeadMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'deputyPoliticalSectorHeadMemberId' })
  deputyPoliticalSectorHead?: Member;

  @Column({ nullable: true })
  deputyOrganizationSectorHeadMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'deputyOrganizationSectorHeadMemberId' })
  deputyOrganizationSectorHead?: Member;

  @Column({ nullable: true })
  deputyFinanceSectorHeadMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'deputyFinanceSectorHeadMemberId' })
  deputyFinanceSectorHead?: Member;

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
