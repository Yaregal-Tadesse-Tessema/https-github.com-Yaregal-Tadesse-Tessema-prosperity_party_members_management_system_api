import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hubret } from './hubret.entity';
import { Member } from './member.entity';

@Entity('commissions')
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  hubretId: string;

  @ManyToOne(() => Hubret, (hubret) => hubret.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hubretId' })
  hubret?: Hubret;

  @Column({ nullable: true })
  member1Id?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member1Id' })
  member1?: Member;

  @Column({ nullable: true })
  member2Id?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member2Id' })
  member2?: Member;

  @Column({ nullable: true })
  member3Id?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member3Id' })
  member3?: Member;

  @Column({ nullable: true })
  member4Id?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member4Id' })
  member4?: Member;

  @Column({ nullable: true })
  member5Id?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member5Id' })
  member5?: Member;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
