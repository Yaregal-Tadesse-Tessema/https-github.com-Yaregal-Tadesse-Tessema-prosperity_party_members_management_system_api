import { Repository } from 'typeorm';
import { Hubret, HubretStatus } from '../../entities/hubret.entity';
import { Family } from '../../entities/family.entity';
import { AuditLogService } from '../audit/audit-log.service';
export interface CreateHubretDto {
    hubretNameAmharic: string;
    hubretNameEnglish: string;
    leaderMemberId?: string;
    deputyPoliticalSectorHeadMemberId?: string;
    deputyOrganizationSectorHeadMemberId?: string;
    deputyFinanceSectorHeadMemberId?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    region?: string;
    zone?: string;
    woreda?: string;
    kebele?: string;
    notes?: string;
}
export interface UpdateHubretDto {
    hubretNameAmharic?: string;
    hubretNameEnglish?: string;
    status?: HubretStatus;
    leaderMemberId?: string;
    deputyPoliticalSectorHeadMemberId?: string;
    deputyOrganizationSectorHeadMemberId?: string;
    deputyFinanceSectorHeadMemberId?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    region?: string;
    zone?: string;
    woreda?: string;
    kebele?: string;
    notes?: string;
}
export declare class HubretsService {
    private hubretRepository;
    private familyRepository;
    private auditLogService;
    constructor(hubretRepository: Repository<Hubret>, familyRepository: Repository<Family>, auditLogService: AuditLogService);
    create(createHubretDto: CreateHubretDto, userId: string): Promise<Hubret>;
    findAll(): Promise<Hubret[]>;
    findOne(id: string): Promise<Hubret>;
    update(id: string, updateHubretDto: UpdateHubretDto, userId: string): Promise<Hubret>;
    remove(id: string, userId: string): Promise<void>;
    getStats(): Promise<{
        totalHubrets: number;
        activeHubrets: number;
        totalFamilies: number;
        totalMembers: number;
    }>;
    checkFamilyAssignment(familyId: string, targetHubretId: string): Promise<{
        canAssign: boolean;
        currentHubret?: {
            id: string;
            name: string;
        };
        message: string;
    }>;
    assignFamilyToHubret(familyId: string, hubretId: string | null, userId: string): Promise<Family>;
    private updateHubretStats;
}
