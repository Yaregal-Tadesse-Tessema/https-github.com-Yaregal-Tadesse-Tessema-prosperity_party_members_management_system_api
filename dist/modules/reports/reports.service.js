"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const member_entity_1 = require("../../entities/member.entity");
const position_history_entity_1 = require("../../entities/position-history.entity");
const contribution_entity_1 = require("../../entities/contribution.entity");
const employment_info_entity_1 = require("../../entities/employment-info.entity");
let ReportsService = class ReportsService {
    memberRepository;
    positionRepository;
    contributionRepository;
    employmentRepository;
    constructor(memberRepository, positionRepository, contributionRepository, employmentRepository) {
        this.memberRepository = memberRepository;
        this.positionRepository = positionRepository;
        this.contributionRepository = contributionRepository;
        this.employmentRepository = employmentRepository;
    }
    async getMemberReport(filters = {}) {
        const query = this.memberRepository.createQueryBuilder('member')
            .leftJoinAndSelect('member.employmentInfo', 'employment')
            .leftJoinAndSelect('member.positionHistory', 'positions')
            .leftJoinAndSelect('member.contributions', 'contributions')
            .orderBy('member.registrationDate', 'DESC');
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
        const summary = {
            totalMembers: totalCount,
            memberMembers: members.filter(m => m.membershipStatus === member_entity_1.MembershipStatus.MEMBER).length,
            supportiveMembers: members.filter(m => m.membershipStatus === member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER).length,
            candidateMembers: members.filter(m => m.membershipStatus === member_entity_1.MembershipStatus.CANDIDATE).length,
            genderDistribution: {
                male: members.filter(m => m.gender === member_entity_1.Gender.MALE).length,
                female: members.filter(m => m.gender === member_entity_1.Gender.FEMALE).length,
            },
            subCityDistribution: this.groupBySubCity(members),
            ageDistribution: this.calculateAgeDistribution(members),
        };
        return { summary, members, totalCount };
    }
    async getPositionReport(filters = {}) {
        const query = this.positionRepository.createQueryBuilder('position')
            .leftJoinAndSelect('position.member', 'member')
            .orderBy('position.startDate', 'DESC');
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
        const summary = {
            totalPositions: totalCount,
            activePositions: positions.filter(p => p.status === position_history_entity_1.PositionStatus.ACTIVE).length,
            completedPositions: positions.filter(p => p.status === position_history_entity_1.PositionStatus.COMPLETED).length,
            revokedPositions: positions.filter(p => p.status === position_history_entity_1.PositionStatus.REVOKED).length,
            positionsByLevel: this.groupByPositionLevel(positions),
            positionsByYear: this.groupByYear(positions),
        };
        return { summary, positions, totalCount };
    }
    async getContributionReport(filters = {}) {
        const query = this.contributionRepository.createQueryBuilder('contribution')
            .leftJoinAndSelect('contribution.member', 'member')
            .orderBy('contribution.paymentYear', 'DESC')
            .addOrderBy('contribution.paymentMonth', 'DESC');
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
        const totalExpected = contributions.reduce((sum, c) => sum + Number(c.expectedAmount), 0);
        const totalPaid = contributions.reduce((sum, c) => sum + Number(c.paidAmount), 0);
        const totalOutstanding = totalExpected - totalPaid;
        const summary = {
            totalContributions: totalCount,
            totalExpected,
            totalPaid,
            totalOutstanding,
            paymentStatusBreakdown: {
                paid: contributions.filter(c => c.paymentStatus === contribution_entity_1.PaymentStatus.PAID).length,
                partiallyPaid: contributions.filter(c => c.paymentStatus === contribution_entity_1.PaymentStatus.PARTIALLY_PAID).length,
                unpaid: contributions.filter(c => c.paymentStatus === contribution_entity_1.PaymentStatus.UNPAID).length,
            },
            paymentMethodBreakdown: this.groupByPaymentMethod(contributions),
            monthlyTrends: this.calculateMonthlyTrends(contributions),
            complianceRate: totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0,
        };
        return { summary, contributions, totalCount };
    }
    async getOutstandingContributions() {
        const contributions = await this.contributionRepository.find({
            where: {
                paymentStatus: contribution_entity_1.PaymentStatus.UNPAID,
            },
            relations: ['member'],
            order: {
                paymentYear: 'DESC',
                paymentMonth: 'DESC',
            },
        });
        const partiallyPaid = await this.contributionRepository.find({
            where: {
                paymentStatus: contribution_entity_1.PaymentStatus.PARTIALLY_PAID,
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
    async getComprehensiveDashboard() {
        const [memberStats, positionStats, contributionStats] = await Promise.all([
            this.getMemberDashboardStats(),
            this.getPositionDashboardStats(),
            this.getContributionDashboardStats(),
        ]);
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
    async getMemberDashboardStats() {
        const members = await this.memberRepository.find();
        return {
            totalMembers: members.length,
            memberMembers: members.filter(m => m.membershipStatus === member_entity_1.MembershipStatus.MEMBER).length,
            activeMembers: members.filter(m => m.status === member_entity_1.Status.ACTIVE).length,
            newThisMonth: members.filter(m => {
                const regDate = new Date(m.registrationDate);
                const now = new Date();
                return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
            }).length,
        };
    }
    async getPositionDashboardStats() {
        const positions = await this.positionRepository.find();
        return {
            totalPositions: positions.length,
            activePositions: positions.filter(p => p.status === position_history_entity_1.PositionStatus.ACTIVE).length,
            positionsByLevel: this.groupByPositionLevel(positions),
        };
    }
    async getContributionDashboardStats() {
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
                if (!paymentDate)
                    return false;
                const date = new Date(paymentDate);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length,
        };
    }
    groupBySubCity(members) {
        return members.reduce((acc, member) => {
            acc[member.subCity] = (acc[member.subCity] || 0) + 1;
            return acc;
        }, {});
    }
    calculateAgeDistribution(members) {
        const now = new Date();
        return members.reduce((acc, member) => {
            const age = now.getFullYear() - new Date(member.dateOfBirth).getFullYear();
            if (age < 25)
                acc.under25++;
            else if (age <= 40)
                acc.age25to40++;
            else if (age <= 60)
                acc.age40to60++;
            else
                acc.over60++;
            return acc;
        }, { under25: 0, age25to40: 0, age40to60: 0, over60: 0 });
    }
    groupByPositionLevel(positions) {
        return positions.reduce((acc, position) => {
            acc[position.positionLevel] = (acc[position.positionLevel] || 0) + 1;
            return acc;
        }, {});
    }
    groupByYear(positions) {
        return positions.reduce((acc, position) => {
            const year = position.startDate.getFullYear();
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});
    }
    groupByPaymentMethod(contributions) {
        return contributions.reduce((acc, contribution) => {
            const method = contribution.paymentMethod || 'unknown';
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});
    }
    calculateMonthlyTrends(contributions) {
        const monthlyData = {};
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
            .slice(0, 12)
            .map(([month, data]) => ({
            month,
            paid: data.paid,
            expected: data.expected,
        }));
    }
    async getMemberByEducationReport() {
        const members = await this.memberRepository.find({
            select: ['educationLevel'],
        });
        const educationBreakdown = members.reduce((acc, member) => {
            const level = member.educationLevel || 'not_specified';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        return {
            summary: {
                totalMembers: members.length,
                educationBreakdown,
            },
            educationBreakdown,
            totalCount: members.length,
        };
    }
    async getMemberByGenderReport() {
        const members = await this.memberRepository.find({
            select: ['gender', 'membershipStatus', 'status'],
        });
        const genderBreakdown = {
            male: members.filter(m => m.gender === member_entity_1.Gender.MALE).length,
            female: members.filter(m => m.gender === member_entity_1.Gender.FEMALE).length,
            maleMember: members.filter(m => m.gender === member_entity_1.Gender.MALE && m.status === member_entity_1.Status.ACTIVE).length,
            femaleMember: members.filter(m => m.gender === member_entity_1.Gender.FEMALE && m.status === member_entity_1.Status.ACTIVE).length,
            maleSupportive: members.filter(m => m.gender === member_entity_1.Gender.MALE && m.membershipStatus === member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER).length,
            femaleSupportive: members.filter(m => m.gender === member_entity_1.Gender.FEMALE && m.membershipStatus === member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER).length,
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
    async getMemberByPositionReport() {
        const positions = await this.positionRepository.find({
            relations: ['member'],
            where: {
                status: position_history_entity_1.PositionStatus.ACTIVE,
            },
        });
        const positionBreakdown = positions.reduce((acc, position) => {
            const level = position.positionLevel || 'not_specified';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        return {
            summary: {
                totalActivePositions: positions.length,
                positionBreakdown,
            },
            positionBreakdown,
            totalCount: positions.length,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(1, (0, typeorm_1.InjectRepository)(position_history_entity_1.PositionHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(contribution_entity_1.Contribution)),
    __param(3, (0, typeorm_1.InjectRepository)(employment_info_entity_1.EmploymentInfo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map