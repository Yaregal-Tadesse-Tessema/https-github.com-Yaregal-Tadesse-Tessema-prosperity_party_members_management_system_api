import { Repository } from 'typeorm';
import { Contribution, PaymentStatus, PaymentMethod, ContributionType } from '../../entities/contribution.entity';
import { Member } from '../../entities/member.entity';
import { AuditLogService } from '../audit/audit-log.service';
export interface CreateContributionDto {
    memberId: string;
    paymentYear: number;
    paymentMonth: number;
    contributionType: ContributionType;
    expectedAmount: number;
    paidAmount: number;
    paymentMethod?: PaymentMethod;
    receiptReference?: string;
    notes?: string;
}
export interface UpdateContributionDto {
    contributionType?: ContributionType;
    expectedAmount?: number;
    paidAmount?: number;
    paymentMethod?: PaymentMethod;
    receiptReference?: string;
    notes?: string;
    paymentDate?: Date;
}
export declare class ContributionsService {
    private contributionRepository;
    private memberRepository;
    private auditLogService;
    constructor(contributionRepository: Repository<Contribution>, memberRepository: Repository<Member>, auditLogService: AuditLogService);
    create(createContributionDto: CreateContributionDto, userId: string, username: string): Promise<Contribution>;
    findAll(page?: number, limit?: number, search?: string, status?: PaymentStatus, year?: number, month?: number): Promise<{
        contributions: Contribution[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByMember(memberId: string, paymentMonth?: number, paymentYear?: number): Promise<Contribution[]>;
    findOne(id: string): Promise<Contribution>;
    update(id: string, updateContributionDto: UpdateContributionDto, userId: string, username: string): Promise<Contribution>;
    remove(id: string, userId: string, username: string): Promise<void>;
    getContributionStats(): Promise<{
        totalContributions: number;
        totalPaid: number;
        totalExpected: number;
        paidContributions: number;
        partiallyPaidContributions: number;
        unpaidContributions: number;
        monthlyStats: {
            month: number;
            year: number;
            paid: number;
            expected: number;
        }[];
    }>;
    getMemberContributionSummary(memberId: string): Promise<{
        totalPaid: number;
        totalExpected: number;
        lastPaymentDate?: Date;
        paymentStreak: number;
        status: string;
    }>;
    generateMonthlyContributions(month: number, year: number, userId: string, username: string): Promise<{
        message: string;
        generatedCount: number;
        period: string;
    }>;
    generateContributionPDF(contributionId: string): Promise<Buffer>;
    private getMonthName;
    generateBulkPaidContributions(month: number, year: number, userId: string, username: string): Promise<{
        message: string;
        statistics: {
            totalMembers: number;
            created: number;
            skipped: number;
            errors: number;
        };
        errors: string[] | undefined;
    }>;
}
