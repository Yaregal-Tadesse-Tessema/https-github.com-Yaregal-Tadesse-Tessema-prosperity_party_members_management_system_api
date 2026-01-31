import { Response as ExpressResponse } from 'express';
import { MembersService, CreateMemberDto, UpdateMemberDto, CreateEmploymentDto } from './members.service';
export declare class MembersController {
    private readonly membersService;
    constructor(membersService: MembersService);
    create(createMemberDto: CreateMemberDto, req: any): Promise<import("../../entities/member.entity").Member>;
    findAll(req: any, page?: string, limit?: string, search?: string, membershipStatus?: string, status?: string, gender?: string, subCity?: string, familyId?: string, educationLevel?: string): Promise<{
        members: import("../../entities/member.entity").Member[];
        total: number;
        page: number;
        limit: number;
    }>;
    getStats(req: any): Promise<{
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
    getMe(req: any): Promise<import("../../entities/member.entity").Member>;
    syncUsers(req: any): Promise<{
        created: number;
        skipped: number;
        errors: {
            memberId: string;
            partyId?: number;
            message: string;
        }[];
    }>;
    syncUser(id: string, req: any): Promise<{
        created: boolean;
        skipped: boolean;
        error?: string;
    }>;
    findOne(id: string, req: any): Promise<import("../../entities/member.entity").Member>;
    update(id: string, updateMemberDto: UpdateMemberDto, req: any): Promise<import("../../entities/member.entity").Member>;
    delete(id: string, req: any): Promise<{
        message: string;
    }>;
    createEmployment(id: string, employmentDto: CreateEmploymentDto, req: any): Promise<import("../../entities/employment-info.entity").EmploymentInfo>;
    getEmploymentHistory(id: string, req: any): Promise<{
        id: string;
        employmentStatus: import("../../entities/employment-info.entity").EmploymentStatus;
        organizationName?: string;
        jobTitle?: string;
        workSector?: string;
        salaryRange?: import("../../entities/employment-info.entity").SalaryRange;
        additionalNotes?: string;
        memberId?: string;
        member?: import("../../entities/member.entity").Member;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    updateEmployment(id: string, employmentId: string, employmentDto: CreateEmploymentDto, req: any): Promise<import("../../entities/employment-info.entity").EmploymentInfo>;
    updateEmploymentLegacy(id: string, employmentDto: CreateEmploymentDto, req: any): Promise<import("../../entities/employment-info.entity").EmploymentInfo>;
    deleteEmployment(id: string, employmentId: string, req: any): Promise<{
        message: string;
    }>;
    uploadEducationalDocuments(id: string, file: Express.Multer.File, req: any): Promise<{
        message: string;
        filename: string;
        originalFilename: string;
        fileSize: number;
    }>;
    uploadExperienceDocuments(id: string, file: Express.Multer.File, req: any): Promise<{
        message: string;
        filename: string;
        originalFilename: string;
        fileSize: number;
    }>;
    downloadEducationalDocuments(id: string, res: ExpressResponse): Promise<ExpressResponse<any, Record<string, any>> | undefined>;
    downloadExperienceDocuments(id: string, res: ExpressResponse): Promise<ExpressResponse<any, Record<string, any>> | undefined>;
    deleteEducationalDocuments(id: string, req: any): Promise<{
        message: string;
    }>;
    deleteExperienceDocuments(id: string, req: any): Promise<{
        message: string;
    }>;
    exportMembersPDF(filters: any, req: any, res: ExpressResponse): Promise<void>;
    exportMembersExcel(filters: any, req: any, res: ExpressResponse): Promise<void>;
    private checkPermission;
    private hasRole;
    private rejectMemberRole;
}
