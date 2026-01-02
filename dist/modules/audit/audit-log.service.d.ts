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
export declare class AuditLogService {
    private auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    logAction(data: AuditLogData): Promise<void>;
    getAuditLogs(entity?: AuditEntity, userId?: string, limit?: number, offset?: number): Promise<AuditLog[]>;
}
