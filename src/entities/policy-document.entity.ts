import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('policy_documents')
export class PolicyDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  fileUrl?: string;

  @Column({ type: 'json', nullable: true })
  fileUrls?: string[];

  @Column({ nullable: true })
  category?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy?: string;
}
