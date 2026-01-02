import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMemberByEducationReport(): Promise<{
        summary: any;
        educationBreakdown: Record<string, number>;
        totalCount: number;
    }>;
    getMemberByGenderReport(): Promise<{
        summary: any;
        genderBreakdown: Record<string, number>;
        totalCount: number;
    }>;
    getMemberByPositionReport(): Promise<{
        summary: any;
        positionBreakdown: Record<string, number>;
        totalCount: number;
    }>;
    getOutstandingContributions(): Promise<{
        summary: any;
        outstandingContributions: any[];
        totalCount: number;
    }>;
    getComprehensiveDashboard(): Promise<{
        memberStats: any;
        positionStats: any;
        contributionStats: any;
        recentActivity: any[];
    }>;
    exportMemberReport(format?: string, startDate?: string, endDate?: string, subCity?: string, woreda?: string, membershipStatus?: string, gender?: string): Promise<{
        format: string;
        data: {
            summary: any;
            members: any[];
            totalCount: number;
        };
        generatedAt: string;
    }>;
    exportContributionReport(format?: string, startDate?: string, endDate?: string, paymentStatus?: string): Promise<{
        format: string;
        data: {
            summary: any;
            contributions: any[];
            totalCount: number;
        };
        generatedAt: string;
    }>;
    getMemberReport(startDate?: string, endDate?: string, subCity?: string, woreda?: string, membershipStatus?: string, gender?: string): Promise<{
        summary: any;
        members: any[];
        totalCount: number;
    }>;
    getPositionReport(startDate?: string, endDate?: string, positionLevel?: string): Promise<{
        summary: any;
        positions: any[];
        totalCount: number;
    }>;
    getContributionReport(startDate?: string, endDate?: string, paymentStatus?: string): Promise<{
        summary: any;
        contributions: any[];
        totalCount: number;
    }>;
}
