import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditEntity } from '../../entities/audit-log.entity';

export interface AuditLogData {
  userId: string;
  username: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction(data: AuditLogData): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId: data.userId,
      username: data.username,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      notes: data.notes,
    });

    await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    entity?: AuditEntity,
    userId?: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (entity) {
      query.andWhere('audit.entity = :entity', { entity });
    }

    if (userId) {
      query.andWhere('audit.userId = :userId', { userId });
    }

    query.orderBy('audit.createdAt', 'DESC');
    query.limit(limit);
    query.offset(offset);

    return query.getMany();
  }
}






