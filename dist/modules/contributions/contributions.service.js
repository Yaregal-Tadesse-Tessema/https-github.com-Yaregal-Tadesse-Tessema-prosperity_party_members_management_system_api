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
exports.ContributionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contribution_entity_1 = require("../../entities/contribution.entity");
const member_entity_1 = require("../../entities/member.entity");
const audit_log_service_1 = require("../audit/audit-log.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const puppeteer = require("puppeteer");
let ContributionsService = class ContributionsService {
    contributionRepository;
    memberRepository;
    auditLogService;
    constructor(contributionRepository, memberRepository, auditLogService) {
        this.contributionRepository = contributionRepository;
        this.memberRepository = memberRepository;
        this.auditLogService = auditLogService;
    }
    async create(createContributionDto, userId, username) {
        const member = await this.memberRepository.findOne({
            where: { id: createContributionDto.memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        const existingContribution = await this.contributionRepository.findOne({
            where: {
                memberId: createContributionDto.memberId,
                paymentYear: createContributionDto.paymentYear,
                paymentMonth: createContributionDto.paymentMonth,
            },
        });
        if (existingContribution) {
            throw new common_1.ConflictException('Contribution already exists for this member and period');
        }
        const contribution = this.contributionRepository.create({
            memberId: createContributionDto.memberId,
            member,
            paymentYear: createContributionDto.paymentYear,
            paymentMonth: createContributionDto.paymentMonth,
            contributionType: createContributionDto.contributionType,
            expectedAmount: createContributionDto.expectedAmount,
            paidAmount: createContributionDto.paidAmount,
            paymentMethod: createContributionDto.paymentMethod,
            receiptReference: createContributionDto.receiptReference,
            notes: createContributionDto.notes,
            paymentStatus: createContributionDto.paidAmount === createContributionDto.expectedAmount ? contribution_entity_1.PaymentStatus.PAID :
                createContributionDto.paidAmount > 0 ? contribution_entity_1.PaymentStatus.PARTIALLY_PAID : contribution_entity_1.PaymentStatus.UNPAID,
            paymentDate: createContributionDto.paidAmount > 0 ? new Date() : undefined,
            createdBy: userId,
            updatedBy: userId,
        });
        const savedContribution = await this.contributionRepository.save(contribution);
        if (!savedContribution.receiptReference) {
            savedContribution.receiptReference = `#${savedContribution.id.substring(0, 8).toUpperCase()}`;
            await this.contributionRepository.save(savedContribution);
        }
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.CREATE,
            entity: audit_log_entity_1.AuditEntity.CONTRIBUTION,
            entityId: savedContribution.id,
            newValues: {
                memberId: savedContribution.memberId,
                paymentYear: savedContribution.paymentYear,
                paymentMonth: savedContribution.paymentMonth,
                paidAmount: savedContribution.paidAmount,
            },
            notes: 'Contribution record created',
        });
        return savedContribution;
    }
    async findAll(page = 1, limit = 10, search, status, year, month) {
        const query = this.contributionRepository.createQueryBuilder('contribution')
            .leftJoinAndSelect('contribution.member', 'member')
            .orderBy('contribution.paymentYear', 'DESC')
            .addOrderBy('contribution.paymentMonth', 'DESC')
            .addOrderBy('contribution.createdAt', 'DESC');
        if (search) {
            query.andWhere('(member.fullNameEnglish ILIKE :search OR member.fullNameAmharic ILIKE :search OR member.partyId ILIKE :search)', { search: `%${search}%` });
        }
        if (status) {
            query.andWhere('contribution.paymentStatus = :status', { status });
        }
        if (year) {
            query.andWhere('contribution.paymentYear = :year', { year });
        }
        if (month) {
            query.andWhere('contribution.paymentMonth = :month', { month });
        }
        const [contributions, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        for (const contribution of contributions) {
            if (!contribution.receiptReference) {
                contribution.receiptReference = `#${contribution.id.substring(0, 8).toUpperCase()}`;
                await this.contributionRepository.save(contribution);
            }
        }
        return { contributions, total, page, limit };
    }
    async findByMember(memberId, paymentMonth, paymentYear) {
        const whereCondition = { memberId };
        if (paymentMonth !== undefined && paymentYear !== undefined) {
            whereCondition.paymentMonth = paymentMonth;
            whereCondition.paymentYear = paymentYear;
        }
        const contributions = await this.contributionRepository.find({
            where: whereCondition,
            relations: ['member'],
            order: { paymentYear: 'DESC', paymentMonth: 'DESC' },
        });
        for (const contribution of contributions) {
            if (!contribution.receiptReference) {
                contribution.receiptReference = `#${contribution.id.substring(0, 8).toUpperCase()}`;
                await this.contributionRepository.save(contribution);
            }
        }
        return contributions;
    }
    async findOne(id) {
        const contribution = await this.contributionRepository.findOne({
            where: { id },
            relations: ['member'],
        });
        if (!contribution) {
            throw new common_1.NotFoundException('Contribution not found');
        }
        if (!contribution.receiptReference) {
            contribution.receiptReference = `#${contribution.id.substring(0, 8).toUpperCase()}`;
            await this.contributionRepository.save(contribution);
        }
        return contribution;
    }
    async update(id, updateContributionDto, userId, username) {
        const contribution = await this.findOne(id);
        const oldValues = {
            paidAmount: contribution.paidAmount,
            paymentStatus: contribution.paymentStatus,
            paymentMethod: contribution.paymentMethod,
            expectedAmount: contribution.expectedAmount,
        };
        Object.assign(contribution, updateContributionDto);
        if (!contribution.receiptReference) {
            contribution.receiptReference = `#${contribution.id.substring(0, 8).toUpperCase()}`;
        }
        if (updateContributionDto.paidAmount !== undefined || updateContributionDto.expectedAmount !== undefined) {
            const paidAmount = updateContributionDto.paidAmount ?? contribution.paidAmount;
            const expectedAmount = updateContributionDto.expectedAmount ?? contribution.expectedAmount;
            contribution.paymentStatus = paidAmount === expectedAmount ? contribution_entity_1.PaymentStatus.PAID :
                paidAmount > 0 ? contribution_entity_1.PaymentStatus.PARTIALLY_PAID : contribution_entity_1.PaymentStatus.UNPAID;
            if (paidAmount > 0 && !contribution.paymentDate) {
                contribution.paymentDate = new Date();
            }
        }
        contribution.updatedBy = userId;
        const updatedContribution = await this.contributionRepository.save(contribution);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.UPDATE,
            entity: audit_log_entity_1.AuditEntity.CONTRIBUTION,
            entityId: id,
            oldValues,
            newValues: {
                paidAmount: updatedContribution.paidAmount,
                paymentStatus: updatedContribution.paymentStatus,
                paymentMethod: updatedContribution.paymentMethod,
                expectedAmount: updatedContribution.expectedAmount,
            },
            notes: 'Contribution record updated',
        });
        return updatedContribution;
    }
    async remove(id, userId, username) {
        const contribution = await this.findOne(id);
        await this.contributionRepository.remove(contribution);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.DELETE,
            entity: audit_log_entity_1.AuditEntity.CONTRIBUTION,
            entityId: id,
            oldValues: {
                memberId: contribution.memberId,
                paymentYear: contribution.paymentYear,
                paymentMonth: contribution.paymentMonth,
                paidAmount: contribution.paidAmount,
            },
            notes: 'Contribution record deleted',
        });
    }
    async getContributionStats() {
        const contributions = await this.contributionRepository.find();
        const stats = {
            totalContributions: contributions.length,
            totalPaid: 0,
            totalExpected: 0,
            paidContributions: 0,
            partiallyPaidContributions: 0,
            unpaidContributions: 0,
            monthlyStats: [],
        };
        const monthlyMap = new Map();
        contributions.forEach(contribution => {
            stats.totalPaid += Number(contribution.paidAmount);
            stats.totalExpected += Number(contribution.expectedAmount);
            switch (contribution.paymentStatus) {
                case contribution_entity_1.PaymentStatus.PAID:
                    stats.paidContributions++;
                    break;
                case contribution_entity_1.PaymentStatus.PARTIALLY_PAID:
                    stats.partiallyPaidContributions++;
                    break;
                case contribution_entity_1.PaymentStatus.UNPAID:
                    stats.unpaidContributions++;
                    break;
            }
            const key = `${contribution.paymentYear}-${contribution.paymentMonth}`;
            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, { paid: 0, expected: 0 });
            }
            const monthly = monthlyMap.get(key);
            monthly.paid += Number(contribution.paidAmount);
            monthly.expected += Number(contribution.expectedAmount);
        });
        stats.monthlyStats = Array.from(monthlyMap.entries()).map(([key, data]) => {
            const [year, month] = key.split('-').map(Number);
            return { year, month, paid: data.paid, expected: data.expected };
        }).sort((a, b) => {
            if (a.year !== b.year)
                return b.year - a.year;
            return b.month - a.month;
        });
        return stats;
    }
    async getMemberContributionSummary(memberId) {
        const contributions = await this.findByMember(memberId);
        const summary = {
            totalPaid: 0,
            totalExpected: 0,
            lastPaymentDate: undefined,
            paymentStreak: 0,
            status: 'active',
        };
        contributions.forEach(contribution => {
            summary.totalPaid += Number(contribution.paidAmount);
            summary.totalExpected += Number(contribution.expectedAmount);
            if (contribution.paymentDate && (!summary.lastPaymentDate || contribution.paymentDate > summary.lastPaymentDate)) {
                summary.lastPaymentDate = contribution.paymentDate;
            }
        });
        const sortedContributions = contributions.sort((a, b) => {
            if (a.paymentYear !== b.paymentYear)
                return b.paymentYear - a.paymentYear;
            return b.paymentMonth - a.paymentMonth;
        });
        let streak = 0;
        for (const contribution of sortedContributions) {
            if (contribution.paidAmount > 0) {
                streak++;
            }
            else {
                break;
            }
        }
        summary.paymentStreak = streak;
        return summary;
    }
    async generateMonthlyContributions(month, year, userId, username) {
        const existingCount = await this.contributionRepository.count({
            where: {
                paymentMonth: month,
                paymentYear: year,
            },
        });
        if (existingCount > 0) {
            throw new common_1.ConflictException(`Contributions for ${month}/${year} already exist`);
        }
        const activeMembers = await this.memberRepository.find({
            where: { membershipStatus: member_entity_1.MembershipStatus.MEMBER },
        });
        if (activeMembers.length === 0) {
            throw new common_1.NotFoundException('No active members found');
        }
        const defaultAmount = 100;
        const contributions = [];
        for (const member of activeMembers) {
            const contribution = this.contributionRepository.create({
                memberId: member.id,
                member,
                paymentMonth: month,
                paymentYear: year,
                contributionType: contribution_entity_1.ContributionType.FIXED_AMOUNT,
                expectedAmount: defaultAmount,
                paidAmount: 0,
                paymentStatus: contribution_entity_1.PaymentStatus.UNPAID,
                createdBy: userId,
            });
            contributions.push(contribution);
        }
        const savedContributions = await this.contributionRepository.save(contributions);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.CREATE,
            entity: audit_log_entity_1.AuditEntity.CONTRIBUTION,
            entityId: 'bulk',
            newValues: {
                count: savedContributions.length,
                period: `${month}/${year}`,
                type: 'bulk_generation',
            },
            notes: `Generated ${savedContributions.length} monthly contributions for ${month}/${year}`,
        });
        return {
            message: `Successfully generated ${savedContributions.length} contributions for ${month}/${year}`,
            generatedCount: savedContributions.length,
            period: `${month}/${year}`,
        };
    }
    async generateContributionPDF(contributionId) {
        const contribution = await this.contributionRepository.findOne({
            where: { id: contributionId },
            relations: ['member'],
        });
        if (!contribution) {
            throw new common_1.NotFoundException('Contribution not found');
        }
        const member = contribution.member;
        const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contribution Receipt - ${member.partyId}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 10px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 5px;
            }
            .receipt-number {
              color: #6b7280;
              font-size: 14px;
            }
            .member-info, .contribution-info {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .label {
              font-weight: bold;
              color: #374151;
            }
            .value {
              color: #6b7280;
            }
            .amount-highlight {
              background-color: #ecfdf5;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
            }
            .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-paid {
              background-color: #dcfce7;
              color: #166534;
            }
            .status-partially_paid {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-unpaid {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="logo">ብልጽግና ፓርቲ</div>
              <div class="logo">Prosperity Party</div>
              <div class="title">Contribution Receipt</div>
              <div class="receipt-number">Receipt #${contribution.id.substring(0, 8).toUpperCase()}</div>
            </div>

            <div class="member-info">
              <h3 style="margin-bottom: 15px; color: #374151;">Member Information</h3>
              <div class="info-row">
                <span class="label">Party ID:</span>
                <span class="value">${member.partyId}</span>
              </div>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${member.fullNameEnglish}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${member.primaryPhone || 'N/A'}</span>
              </div>
            </div>

            <div class="contribution-info">
              <h3 style="margin-bottom: 15px; color: #374151;">Contribution Details</h3>
              <div class="info-row">
                <span class="label">Period:</span>
                <span class="value">${this.getMonthName(contribution.paymentMonth)} ${contribution.paymentYear}</span>
              </div>
              <div class="info-row">
                <span class="label">Payment Date:</span>
                <span class="value">${contribution.paymentDate ? new Date(contribution.paymentDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">${contribution.paymentMethod ? contribution.paymentMethod.replace('_', ' ').toUpperCase() : 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">
                  <span class="status status-${contribution.paymentStatus.toLowerCase().replace('_', '-')}">
                    ${contribution.paymentStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </span>
              </div>
            </div>

            <div class="amount-highlight">
              <div style="margin-bottom: 10px; color: #374151;">Amount Paid</div>
              <div class="amount">ETB ${contribution.paidAmount.toLocaleString()}</div>
            </div>

            <div class="footer">
              <p>This is an official receipt for your contribution to the Prosperity Party.</p>
              <p>Thank you for your contribution to the Prosperity Party!</p>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        await browser.close();
        return Buffer.from(pdfBuffer);
    }
    getMonthName(month) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1] || 'Unknown';
    }
};
exports.ContributionsService = ContributionsService;
exports.ContributionsService = ContributionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contribution_entity_1.Contribution)),
    __param(1, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_log_service_1.AuditLogService])
], ContributionsService);
//# sourceMappingURL=contributions.service.js.map