import { Repository } from 'typeorm';
import { PositionHistory, PositionLevel, PositionStatus } from '../../entities/position-history.entity';
import { Member } from '../../entities/member.entity';
import { AuditLogService } from '../audit/audit-log.service';
export interface CreatePositionDto {
    memberId: string;
    positionTitle: string;
    positionLevel: PositionLevel;
    startDate: Date;
    endDate?: Date;
    appointingAuthority?: string;
    status?: PositionStatus;
    responsibilities?: string;
    achievements?: string;
}
export interface UpdatePositionDto {
    positionTitle?: string;
    positionLevel?: PositionLevel;
    startDate?: Date;
    endDate?: Date;
    appointingAuthority?: string;
    status?: PositionStatus;
    responsibilities?: string;
    achievements?: string;
}
export declare class PositionsService {
    private positionRepository;
    private memberRepository;
    private auditLogService;
    constructor(positionRepository: Repository<PositionHistory>, memberRepository: Repository<Member>, auditLogService: AuditLogService);
    create(createPositionDto: CreatePositionDto, userId: string, username: string): Promise<PositionHistory>;
    findAll(page?: number, limit?: number, search?: string, level?: PositionLevel, status?: PositionStatus): Promise<{
        positions: PositionHistory[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByMember(memberId: string): Promise<PositionHistory[]>;
    findOne(id: string): Promise<PositionHistory>;
    update(id: string, updatePositionDto: UpdatePositionDto, userId: string, username: string): Promise<PositionHistory>;
    remove(id: string, userId: string, username: string): Promise<void>;
    getPositionStats(): Promise<{
        totalPositions: number;
        activePositions: number;
        completedPositions: number;
        revokedPositions: number;
        positionsByLevel: Record<string, number>;
    }>;
}
