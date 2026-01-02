import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
}

export enum AuditEntity {
  USER = 'user',
  MEMBER = 'member',
  POSITION = 'position',
  CONTRIBUTION = 'contribution',
  CONTRIBUTION_RULE = 'contribution_rule',
  FILE = 'file',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  username: string;

  @Column({
    type: 'varchar',
  })
  action: AuditAction;

  @Column({
    type: 'varchar',
  })
  entity: AuditEntity;

  @Column()
  entityId: string;

  @Column({ type: 'json', nullable: true })
  oldValues?: any;

  @Column({ type: 'json', nullable: true })
  newValues?: any;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;
}
