import { ContributionsService, CreateContributionDto, UpdateContributionDto } from './contributions.service';
export declare class ContributionsController {
    private readonly contributionsService;
    constructor(contributionsService: ContributionsService);
    create(createContributionDto: CreateContributionDto, req: any): Promise<import("../../entities/contribution.entity").Contribution>;
    findAll(page?: string, limit?: string, search?: string, status?: string, year?: string, month?: string): Promise<{
        contributions: import("../../entities/contribution.entity").Contribution[];
        total: number;
        page: number;
        limit: number;
    }>;
    getStats(): Promise<{
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
    findByMember(memberId: string, paymentMonth?: number, paymentYear?: number): Promise<import("../../entities/contribution.entity").Contribution[]>;
    getMemberSummary(memberId: string): Promise<{
        totalPaid: number;
        totalExpected: number;
        lastPaymentDate?: Date;
        paymentStreak: number;
        status: string;
    }>;
    findOne(id: string): Promise<import("../../entities/contribution.entity").Contribution>;
    update(id: string, updateContributionDto: UpdateContributionDto, req: any): Promise<import("../../entities/contribution.entity").Contribution>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    generateContributions(generateDto: {
        month: number;
        year: number;
    }, req: any): Promise<{
        message: string;
        generatedCount: number;
        period: string;
    }>;
    generateBulkContributions(generateDto: {
        month: number;
        year: number;
    }, req: any): Promise<{
        message: string;
        statistics: {
            totalMembers: number;
            created: number;
            skipped: number;
            errors: number;
        };
        errors: string[] | undefined;
    }>;
    downloadPDF(id: string, req: any, res: any): Promise<any>;
}
