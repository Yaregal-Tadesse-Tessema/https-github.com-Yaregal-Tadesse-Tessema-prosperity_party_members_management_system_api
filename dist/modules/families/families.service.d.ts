import { Repository } from 'typeorm';
import { Family, FamilyType, FamilyStatus } from '../../entities/family.entity';
import { Member } from '../../entities/member.entity';
import { AuditLogService } from '../audit/audit-log.service';
export interface CreateFamilyDto {
    familyId: string;
    familyNameAmharic: string;
    familyNameEnglish: string;
    familyType?: FamilyType;
    contactMemberId?: string;
    notes?: string;
}
export interface UpdateFamilyDto {
    familyNameAmharic?: string;
    familyNameEnglish?: string;
    familyType?: FamilyType;
    status?: FamilyStatus;
    headMemberId?: string;
    contactMemberId?: string;
    notes?: string;
}
export declare class FamiliesService {
    private familyRepository;
    private memberRepository;
    private auditLogService;
    constructor(familyRepository: Repository<Family>, memberRepository: Repository<Member>, auditLogService: AuditLogService);
    create(createFamilyDto: CreateFamilyDto, userId: string, username: string): Promise<Family>;
    findAll(page?: number, limit?: number, search?: string, status?: FamilyStatus): Promise<{
        families: Family[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Family>;
    findByFamilyId(familyId: string): Promise<Family>;
    update(id: string, updateFamilyDto: UpdateFamilyDto, userId: string, username: string): Promise<Family>;
    remove(id: string, userId: string, username: string): Promise<void>;
    getStats(): Promise<{
        totalFamilies: number;
        activeFamilies: number;
        nuclearFamilies: number;
        extendedFamilies: number;
        totalMaleMembers: number;
        totalFemaleMembers: number;
        activeMaleMembers: number;
        activeFemaleMembers: number;
        inactiveMaleMembers: number;
        inactiveFemaleMembers: number;
    }>;
    updateMemberCount(familyId: string): Promise<void>;
}
