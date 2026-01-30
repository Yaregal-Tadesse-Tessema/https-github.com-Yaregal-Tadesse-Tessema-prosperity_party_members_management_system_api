import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { Member } from './member.entity';
import { Hubret } from './hubret.entity';

export enum FamilyType {
  NUCLEAR = 'nuclear',
  EXTENDED = 'extended',
  SINGLE_PARENT = 'single_parent',
  BLENDED = 'blended',
  OTHER = 'other'
}

export enum FamilyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISSOLVED = 'dissolved'
}

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  familyId: string; // e.g., FAM-0001

  @Column()
  familyNameAmharic: string;

  @Column()
  familyNameEnglish: string;

  @Column({
    type: 'varchar',
    default: FamilyType.NUCLEAR,
  })
  familyType: FamilyType;

  @Column({
    type: 'varchar',
    default: FamilyStatus.ACTIVE,
  })
  status: FamilyStatus;

  // Family Head Information
  @Column({ nullable: true })
  headMemberId?: string;

  // Contact Member Information
  @Column({ nullable: true })
  contactMemberId?: string;

  // Position holders (Member relations): Sebsabi, Finance, Political Sector
  @Column({ nullable: true })
  organizerCoordinatorMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'organizerCoordinatorMemberId' })
  organizerCoordinator?: Member;

  @Column({ nullable: true })
  financeMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'financeMemberId' })
  finance?: Member;

  @Column({ nullable: true })
  politicalSectorMemberId?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'politicalSectorMemberId' })
  politicalSector?: Member;

  // Hubret Relationship
  @Column({ nullable: true })
  hubretId?: string;

  @ManyToOne(() => Hubret, hubret => hubret.families, { nullable: true })
  @JoinColumn({ name: 'hubretId' })
  hubret?: Hubret;

  @Column({ type: 'int', default: 0 })
  totalMembers: number;

  @Column({ type: 'int', default: 0 })
  activeMembers: number;

  @Column({ nullable: true })
  notes?: string;

  // Relationships
  @OneToMany(() => Member, member => member.family)
  members: Member[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy?: string; // User ID

  @Column({ nullable: true })
  updatedBy?: string; // User ID
}
