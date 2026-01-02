import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Member } from './member.entity';

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  SELF_EMPLOYED = 'self_employed',
  UNEMPLOYED = 'unemployed',
}

export enum SalaryRange {
  RANGE_0_5000 = '0-5000',
  RANGE_5001_10000 = '5001-10000',
  RANGE_10001_20000 = '10001-20000',
  RANGE_20001_30000 = '20001-30000',
  RANGE_30001_50000 = '30001-50000',
  RANGE_50001_PLUS = '50001+',
}

@Entity('employment_info')
export class EmploymentInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
  })
  employmentStatus: EmploymentStatus;

  @Column({ nullable: true })
  organizationName?: string;

  @Column({ nullable: true })
  jobTitle?: string;

  @Column({ nullable: true })
  workSector?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlySalary?: number;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  salaryRange?: SalaryRange;

  @Column({ type: 'text', nullable: true })
  additionalNotes?: string;

  @Column({ nullable: true })
  memberId?: string;

  @ManyToOne(() => Member, member => member.employmentHistory, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member?: Member;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
