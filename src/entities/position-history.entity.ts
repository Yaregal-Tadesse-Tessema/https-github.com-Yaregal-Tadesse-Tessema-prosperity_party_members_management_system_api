import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Member } from './member.entity';

export enum PositionLevel {
  CELL = 'cell',
  WOREDA = 'woreda',
  SUB_CITY = 'sub_city',
  CITY = 'city',
  REGIONAL = 'regional',
}

export enum PositionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REVOKED = 'revoked',
}

@Entity('position_history')
export class PositionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => Member, member => member.positionHistory)
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column()
  positionTitle: string;

  @Column({
    type: 'varchar',
  })
  positionLevel: PositionLevel;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ nullable: true })
  appointingAuthority?: string;

  @Column({
    type: 'varchar',
    default: PositionStatus.ACTIVE,
  })
  status: PositionStatus;

  @Column({ type: 'text', nullable: true })
  responsibilities?: string;

  @Column({ type: 'text', nullable: true })
  achievements?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy?: string; // User ID

  @Column({ nullable: true })
  updatedBy?: string; // User ID
}
