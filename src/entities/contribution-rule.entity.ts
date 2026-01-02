import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PositionLevel } from './position-history.entity';
import { SalaryRange } from './employment-info.entity';

export enum RuleType {
  SALARY_RANGE = 'salary_range',
  POSITION_LEVEL = 'position_level',
  SPECIAL_CATEGORY = 'special_category',
}

@Entity('contribution_rules')
export class ContributionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
  })
  ruleType: RuleType;

  // For salary range rules
  @Column({
    type: 'varchar',
    nullable: true,
  })
  salaryRange?: SalaryRange;

  // For position level rules
  @Column({
    type: 'varchar',
    nullable: true,
  })
  positionLevel?: PositionLevel;

  // For special category rules
  @Column({ nullable: true })
  specialCategory?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  contributionAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentageOfSalary?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  effectiveFrom?: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy?: string; // User ID

  @Column({ nullable: true })
  updatedBy?: string; // User ID
}
