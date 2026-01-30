import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'date' })
  publishedAt: Date;

  @Column({ nullable: true })
  author?: string;

  @Column({ nullable: true })
  attachmentUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy?: string;
}
