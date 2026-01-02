import { Repository } from 'typeorm';
import { Member, MembershipStatus, Gender } from '../../entities/member.entity';
import { PositionHistory, PositionLevel } from '../../entities/position-history.entity';
import { Contribution, PaymentStatus } from '../../entities/contribution.entity';
import { EmploymentInfo } from '../../entities/employment-info.entity';
export interface ReportFilters {
    startDate?: Date;
    endDate?: Date;
    subCity?: string;
    woreda?: string;
    membershipStatus?: MembershipStatus;
    positionLevel?: PositionLevel;
    paymentStatus?: PaymentStatus;
    gender?: Gender;
}
export declare class ReportsService {
    private memberRepository;
    private positionRepository;
    private contributionRepository;
    private employmentRepository;
    constructor(memberRepository: Repository<Member>, positionRepository: Repository<PositionHistory>, contributionRepository: Repository<Contribution>, employmentRepository: Repository<EmploymentInfo>);
    getMemberReport(filters?: ReportFilters): Promise<{
        summary: any;
        members: any[];
        totalCount: number;
    }>;
    getPositionReport(filters?: ReportFilters): Promise<{
        summary: any;
        positions: any[];
        totalCount: number;
    }>;
    getContributionReport(filters?: ReportFilters): Promise<{
        summary: any;
        contributions: any[];
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
    private getMemberDashboardStats;
    private getPositionDashboardStats;
    private getContributionDashboardStats;
    private groupBySubCity;
    private calculateAgeDistribution;
    private groupByPositionLevel;
    private groupByYear;
    private groupByPaymentMethod;
    private calculateMonthlyTrends;
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
}
