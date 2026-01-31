import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Member, MembershipStatus, Gender, EducationLevel, Status } from '../../entities/member.entity';
import { PositionHistory, PositionLevel, PositionStatus } from '../../entities/position-history.entity';
import { Contribution, PaymentStatus, PaymentMethod } from '../../entities/contribution.entity';
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

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(PositionHistory)
    private positionRepository: Repository<PositionHistory>,
    @InjectRepository(Contribution)
    private contributionRepository: Repository<Contribution>,
    @InjectRepository(EmploymentInfo)
    private employmentRepository: Repository<EmploymentInfo>,
  ) {}

  async getMemberReport(filters: ReportFilters = {}): Promise<{
    summary: any;
    members: any[];
    totalCount: number;
  }> {
    const query = this.memberRepository.createQueryBuilder('member')
      .leftJoinAndSelect('member.employmentInfo', 'employment')
      .leftJoinAndSelect('member.positionHistory', 'positions')
      .leftJoinAndSelect('member.contributions', 'contributions')
      .orderBy('member.registrationDate', 'DESC');

    // Apply filters
    if (filters.subCity) {
      query.andWhere('member.subCity = :subCity', { subCity: filters.subCity });
    }
    if (filters.woreda) {
      query.andWhere('member.woreda = :woreda', { woreda: filters.woreda });
    }
    if (filters.membershipStatus) {
      query.andWhere('member.membershipStatus = :status', { status: filters.membershipStatus });
    }
    if (filters.gender) {
      query.andWhere('member.gender = :gender', { gender: filters.gender });
    }

    const members = await query.getMany();
    const totalCount = members.length;

    // Generate summary statistics
    const summary = {
      totalMembers: totalCount,
      memberMembers: members.filter(m => m.membershipStatus === MembershipStatus.MEMBER).length,
      supportiveMembers: members.filter(m => m.membershipStatus === MembershipStatus.SUPPORTIVE_MEMBER).length,
      candidateMembers: members.filter(m => m.membershipStatus === MembershipStatus.CANDIDATE).length,
      genderDistribution: {
        male: members.filter(m => m.gender === Gender.MALE).length,
        female: members.filter(m => m.gender === Gender.FEMALE).length,
      },
      subCityDistribution: this.groupBySubCity(members),
      ageDistribution: this.calculateAgeDistribution(members),
    };

    return { summary, members, totalCount };
  }

  async getPositionReport(filters: ReportFilters = {}): Promise<{
    summary: any;
    positions: any[];
    totalCount: number;
  }> {
    const query = this.positionRepository.createQueryBuilder('position')
      .leftJoinAndSelect('position.member', 'member')
      .orderBy('position.startDate', 'DESC');

    // Apply filters
    if (filters.positionLevel) {
      query.andWhere('position.positionLevel = :level', { level: filters.positionLevel });
    }
    if (filters.startDate && filters.endDate) {
      query.andWhere('position.startDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    const positions = await query.getMany();
    const totalCount = positions.length;

    // Generate summary statistics
    const summary = {
      totalPositions: totalCount,
      activePositions: positions.filter(p => p.status === PositionStatus.ACTIVE).length,
      completedPositions: positions.filter(p => p.status === PositionStatus.COMPLETED).length,
      revokedPositions: positions.filter(p => p.status === PositionStatus.REVOKED).length,
      positionsByLevel: this.groupByPositionLevel(positions),
      positionsByYear: this.groupByYear(positions),
    };

    return { summary, positions, totalCount };
  }

  async getContributionReport(filters: ReportFilters = {}): Promise<{
    summary: any;
    contributions: any[];
    totalCount: number;
  }> {
    const query = this.contributionRepository.createQueryBuilder('contribution')
      .leftJoinAndSelect('contribution.member', 'member')
      .orderBy('contribution.paymentYear', 'DESC')
      .addOrderBy('contribution.paymentMonth', 'DESC');

    // Apply filters
    if (filters.paymentStatus) {
      query.andWhere('contribution.paymentStatus = :status', { status: filters.paymentStatus });
    }
    if (filters.startDate) {
      query.andWhere('contribution.paymentDate >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere('contribution.paymentDate <= :endDate', { endDate: filters.endDate });
    }

    const contributions = await query.getMany();
    const totalCount = contributions.length;

    // Generate summary statistics
    const totalExpected = contributions.reduce((sum, c) => sum + Number(c.expectedAmount), 0);
    const totalPaid = contributions.reduce((sum, c) => sum + Number(c.paidAmount), 0);
    const totalOutstanding = totalExpected - totalPaid;

    const summary = {
      totalContributions: totalCount,
      totalExpected,
      totalPaid,
      totalOutstanding,
      paymentStatusBreakdown: {
        paid: contributions.filter(c => c.paymentStatus === PaymentStatus.PAID).length,
        partiallyPaid: contributions.filter(c => c.paymentStatus === PaymentStatus.PARTIALLY_PAID).length,
        unpaid: contributions.filter(c => c.paymentStatus === PaymentStatus.UNPAID).length,
      },
      paymentMethodBreakdown: this.groupByPaymentMethod(contributions),
      monthlyTrends: this.calculateMonthlyTrends(contributions),
      complianceRate: totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0,
    };

    return { summary, contributions, totalCount };
  }

  async getOutstandingContributions(): Promise<{
    summary: any;
    outstandingContributions: any[];
    totalCount: number;
  }> {
    const contributions = await this.contributionRepository.find({
      where: {
        paymentStatus: PaymentStatus.UNPAID,
      },
      relations: ['member'],
      order: {
        paymentYear: 'DESC',
        paymentMonth: 'DESC',
      },
    });

    const partiallyPaid = await this.contributionRepository.find({
      where: {
        paymentStatus: PaymentStatus.PARTIALLY_PAID,
      },
      relations: ['member'],
      order: {
        paymentYear: 'DESC',
        paymentMonth: 'DESC',
      },
    });

    const outstandingContributions = [...contributions, ...partiallyPaid];
    const totalCount = outstandingContributions.length;

    const totalOutstanding = outstandingContributions.reduce((sum, c) => {
      return sum + (Number(c.expectedAmount) - Number(c.paidAmount));
    }, 0);

    const summary = {
      totalOutstandingContributions: totalCount,
      totalOutstandingAmount: totalOutstanding,
      fullyUnpaid: contributions.length,
      partiallyPaid: partiallyPaid.length,
      membersWithOutstanding: new Set(outstandingContributions.map(c => c.memberId)).size,
    };

    return { summary, outstandingContributions, totalCount };
  }

  async getComprehensiveDashboard(): Promise<{
    memberStats: any;
    positionStats: any;
    contributionStats: any;
    recentActivity: any[];
  }> {
    // Get all basic stats
    const [memberStats, positionStats, contributionStats] = await Promise.all([
      this.getMemberDashboardStats(),
      this.getPositionDashboardStats(),
      this.getContributionDashboardStats(),
    ]);

    // Get recent activity (mock data for now - in real app would come from audit logs)
    const recentActivity = [
      { type: 'member', action: 'registered', name: 'New member registered', date: new Date() },
      { type: 'contribution', action: 'paid', name: 'Contribution payment received', date: new Date() },
      { type: 'position', action: 'assigned', name: 'New position assigned', date: new Date() },
    ];

    return {
      memberStats,
      positionStats,
      contributionStats,
      recentActivity,
    };
  }

  private async getMemberDashboardStats(): Promise<any> {
    const members = await this.memberRepository.find();

    return {
      totalMembers: members.length,
      memberMembers: members.filter(m => m.membershipStatus === MembershipStatus.MEMBER).length,
      activeMembers: members.filter(m => m.status === Status.ACTIVE).length,
      newThisMonth: members.filter(m => {
        const regDate = new Date(m.registrationDate);
        const now = new Date();
        return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
      }).length,
    };
  }

  private async getPositionDashboardStats(): Promise<any> {
    const positions = await this.positionRepository.find();

    return {
      totalPositions: positions.length,
      activePositions: positions.filter(p => p.status === PositionStatus.ACTIVE).length,
      positionsByLevel: this.groupByPositionLevel(positions),
    };
  }

  private async getContributionDashboardStats(): Promise<any> {
    const contributions = await this.contributionRepository.find();

    const totalExpected = contributions.reduce((sum, c) => sum + Number(c.expectedAmount), 0);
    const totalPaid = contributions.reduce((sum, c) => sum + Number(c.paidAmount), 0);

    return {
      totalContributions: contributions.length,
      totalPaid,
      totalExpected,
      complianceRate: totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0,
      paidThisMonth: contributions.filter(c => {
        const paymentDate = c.paymentDate;
        if (!paymentDate) return false;
        const date = new Date(paymentDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
    };
  }

  private groupBySubCity(members: Member[]): Record<string, number> {
    return members.reduce((acc, member) => {
      acc[member.subCity] = (acc[member.subCity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAgeDistribution(members: Member[]): { under25: number; age25to40: number; age40to60: number; over60: number } {
    const now = new Date();
    return members.reduce((acc, member) => {
      const age = now.getFullYear() - new Date(member.dateOfBirth).getFullYear();
      if (age < 25) acc.under25++;
      else if (age <= 40) acc.age25to40++;
      else if (age <= 60) acc.age40to60++;
      else acc.over60++;
      return acc;
    }, { under25: 0, age25to40: 0, age40to60: 0, over60: 0 });
  }

  private groupByPositionLevel(positions: PositionHistory[]): Record<string, number> {
    return positions.reduce((acc, position) => {
      acc[position.positionLevel] = (acc[position.positionLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByYear(positions: PositionHistory[]): Record<number, number> {
    return positions.reduce((acc, position) => {
      const year = position.startDate.getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private groupByPaymentMethod(contributions: Contribution[]): Record<string, number> {
    return contributions.reduce((acc, contribution) => {
      const method = contribution.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateMonthlyTrends(contributions: Contribution[]): { month: string; paid: number; expected: number }[] {
    const monthlyData: Record<string, { paid: number; expected: number }> = {};

    contributions.forEach(contribution => {
      const key = `${contribution.paymentYear}-${contribution.paymentMonth.toString().padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { paid: 0, expected: 0 };
      }
      monthlyData[key].paid += Number(contribution.paidAmount);
      monthlyData[key].expected += Number(contribution.expectedAmount);
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12) // Last 12 months
      .map(([month, data]) => ({
        month,
        paid: data.paid,
        expected: data.expected,
      }));
  }

  async getMemberByEducationReport(): Promise<{
    summary: any;
    educationBreakdown: Record<string, number>;
    totalCount: number;
  }> {
    const members = await this.memberRepository.find({
      select: ['educationLevel'],
    });

    const educationBreakdown = members.reduce((acc, member) => {
      const level = member.educationLevel || 'not_specified';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalMembers: members.length,
        educationBreakdown,
      },
      educationBreakdown,
      totalCount: members.length,
    };
  }

  async getMemberByGenderReport(): Promise<{
    summary: any;
    genderBreakdown: Record<string, number>;
    totalCount: number;
  }> {
    const members = await this.memberRepository.find({
      select: ['gender', 'membershipStatus', 'status'],
    });

    const genderBreakdown = {
      male: members.filter(m => m.gender === Gender.MALE).length,
      female: members.filter(m => m.gender === Gender.FEMALE).length,
      maleMember: members.filter(m => m.gender === Gender.MALE && m.status === Status.ACTIVE).length,
      femaleMember: members.filter(m => m.gender === Gender.FEMALE && m.status === Status.ACTIVE).length,
      maleSupportive: members.filter(m => m.gender === Gender.MALE && m.membershipStatus === MembershipStatus.SUPPORTIVE_MEMBER).length,
      femaleSupportive: members.filter(m => m.gender === Gender.FEMALE && m.membershipStatus === MembershipStatus.SUPPORTIVE_MEMBER).length,
    };

    return {
      summary: {
        totalMembers: members.length,
        totalMale: genderBreakdown.male,
        totalFemale: genderBreakdown.female,
        maleMember: genderBreakdown.maleMember,
        femaleMember: genderBreakdown.femaleMember,
        activeMale: genderBreakdown.maleMember,
        activeFemale: genderBreakdown.femaleMember,
        inactiveMale: genderBreakdown.maleSupportive,
        inactiveFemale: genderBreakdown.femaleSupportive,
      },
      genderBreakdown,
      totalCount: members.length,
    };
  }

  async getMemberByPositionReport(): Promise<{
    summary: any;
    positionBreakdown: Record<string, number>;
    totalCount: number;
  }> {
    const positions = await this.positionRepository.find({
      relations: ['member'],
      where: {
        status: PositionStatus.ACTIVE,
      },
    });

    const positionBreakdown = positions.reduce((acc, position) => {
      const level = position.positionLevel || 'not_specified';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalActivePositions: positions.length,
        positionBreakdown,
      },
      positionBreakdown,
      totalCount: positions.length,
    };
  }
}


