import { Repository } from 'typeorm';
import { Member, MembershipStatus, Gender, FamilyRelationship, MaritalStatus, Status } from '../../entities/member.entity';
import { EmploymentInfo, EmploymentStatus, SalaryRange } from '../../entities/employment-info.entity';
import { FileAttachment } from '../../entities/file-attachment.entity';
import { Contribution } from '../../entities/contribution.entity';
import { PositionHistory } from '../../entities/position-history.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { FamiliesService } from '../families/families.service';
export interface CreateMemberDto {
    partyId: number;
    nationalId?: string;
    fullNameAmharic: string;
    fullNameEnglish: string;
    gender: Gender;
    dateOfBirth: Date;
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    subCity: string;
    woreda: string;
    kebele: string;
    detailedAddress?: string;
    registrationDate: Date;
    notes?: string;
    educationalDocumentsFile?: string;
    experienceDocumentsFile?: string;
    familyId?: string;
    familyRelationship?: FamilyRelationship;
    contributionPercentage?: number;
    maritalStatus?: MaritalStatus;
    salaryAmount?: number;
    membershipStatus?: MembershipStatus;
    status?: Status;
}
export interface UpdateMemberDto {
    partyId?: number;
    nationalId?: string;
    fullNameAmharic?: string;
    fullNameEnglish?: string;
    gender?: Gender;
    dateOfBirth?: Date;
    primaryPhone?: string;
    secondaryPhone?: string;
    email?: string;
    subCity?: string;
    woreda?: string;
    kebele?: string;
    detailedAddress?: string;
    membershipStatus?: MembershipStatus;
    notes?: string;
    educationalDocumentsFile?: string;
    experienceDocumentsFile?: string;
    familyId?: string;
    familyRelationship?: FamilyRelationship;
    contributionPercentage?: number;
    maritalStatus?: MaritalStatus;
    salaryAmount?: number;
    status?: Status;
}
export interface CreateEmploymentDto {
    employmentStatus: EmploymentStatus;
    organizationName?: string;
    jobTitle?: string;
    workSector?: string;
    monthlySalary?: number;
    salaryRange?: SalaryRange;
    additionalNotes?: string;
}
export declare class MembersService {
    private memberRepository;
    private employmentRepository;
    private fileAttachmentRepository;
    private contributionRepository;
    private positionHistoryRepository;
    private auditLogService;
    private familiesService;
    private s3Client;
    constructor(memberRepository: Repository<Member>, employmentRepository: Repository<EmploymentInfo>, fileAttachmentRepository: Repository<FileAttachment>, contributionRepository: Repository<Contribution>, positionHistoryRepository: Repository<PositionHistory>, auditLogService: AuditLogService, familiesService: FamiliesService);
    create(createMemberDto: CreateMemberDto, userId: string, username: string): Promise<Member>;
    findAll(page?: number, limit?: number, search?: string, membershipStatus?: MembershipStatus, status?: Status, gender?: Gender, subCity?: string, familyId?: string): Promise<{
        members: Member[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Member>;
    update(id: string, updateMemberDto: UpdateMemberDto, userId: string, username: string): Promise<Member>;
    createEmploymentInfo(memberId: string, employmentDto: CreateEmploymentDto, userId: string, username: string): Promise<EmploymentInfo>;
    updateEmploymentInfo(memberId: string, employmentId: string, employmentDto: CreateEmploymentDto, userId: string, username: string): Promise<EmploymentInfo>;
    deleteEmploymentInfo(memberId: string, employmentId: string, userId: string, username: string): Promise<void>;
    getEmploymentHistory(memberId: string): Promise<EmploymentInfo[]>;
    getMemberStats(): Promise<{
        totalMembers: number;
        memberMembers: number;
        supportiveMembers: number;
        candidateMembers: number;
        totalMaleMembers: number;
        totalFemaleMembers: number;
        memberMaleMembers: number;
        memberFemaleMembers: number;
        supportiveMaleMembers: number;
        supportiveFemaleMembers: number;
        candidateMaleMembers: number;
        candidateFemaleMembers: number;
    }>;
    uploadEducationalDocuments(memberId: string, file: Express.Multer.File, userId: string, username: string): Promise<{
        message: string;
        filename: string;
        originalFilename: string;
        fileSize: number;
    }>;
    uploadExperienceDocuments(memberId: string, file: Express.Multer.File, userId: string, username: string): Promise<{
        message: string;
        filename: string;
        originalFilename: string;
        fileSize: number;
    }>;
    getEducationalDocuments(memberId: string): Promise<{
        filePath: string;
        mimeType: string;
        originalFilename: string;
    } | null>;
    downloadEducationalDocuments(memberId: string): Promise<Buffer | null>;
    getExperienceDocuments(memberId: string): Promise<{
        filePath: string;
        mimeType: string;
        originalFilename: string;
    } | null>;
    downloadExperienceDocuments(memberId: string): Promise<Buffer | null>;
    deleteEducationalDocuments(memberId: string, userId: string, username: string): Promise<{
        message: string;
    }>;
    deleteExperienceDocuments(memberId: string, userId: string, username: string): Promise<{
        message: string;
    }>;
    getFilteredMembers(filters: any): Promise<Member[]>;
    generateMembersPDF(members: any[]): Promise<Buffer>;
    generateMembersExcel(members: any[]): Promise<Buffer>;
    delete(id: string, userId: string, username: string): Promise<void>;
}
