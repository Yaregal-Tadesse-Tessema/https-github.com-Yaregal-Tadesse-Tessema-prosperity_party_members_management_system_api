import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Member } from './member.entity';

export enum PaymentMethod {
  CASH = 'cash',
  BANK = 'bank',
  MOBILE_MONEY = 'mobile_money',
}

export enum PaymentStatus {
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  UNPAID = 'unpaid',
}

export enum ContributionType {
  FIXED_AMOUNT = 'fixed_amount',
  PERCENTAGE_OF_SALARY = 'percentage_of_salary',
}

@Entity('contributions')
@Index(['memberId', 'paymentMonth', 'paymentYear'], { unique: true })
export class Contribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => Member, member => member.contributions)
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column({ type: 'int' })
  paymentYear: number;

  @Column({ type: 'int' })
  paymentMonth: number; // 1-12

  @Column({
    type: 'varchar',
  })
  contributionType: ContributionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  expectedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'varchar',
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  paymentMethod?: PaymentMethod;

  @Column({ nullable: true })
  receiptReference?: string;

  @Column({ type: 'date', nullable: true })
  paymentDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy?: string; // User ID

  @Column({ nullable: true })
  updatedBy?: string; // User ID
}
