import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contribution, PaymentStatus, PaymentMethod, ContributionType } from '../../entities/contribution.entity';
import { Member, MembershipStatus, Status } from '../../entities/member.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';
import * as puppeteer from 'puppeteer';

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

@Injectable()
export class ContributionsService {
  constructor(
    @InjectRepository(Contribution)
    private contributionRepository: Repository<Contribution>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private auditLogService: AuditLogService,
  ) {}

  async create(createContributionDto: CreateContributionDto, userId: string, username: string): Promise<Contribution> {
    const member = await this.memberRepository.findOne({
      where: { id: createContributionDto.memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if contribution already exists for this member, year, and month
    const existingContribution = await this.contributionRepository.findOne({
      where: {
        memberId: createContributionDto.memberId,
        paymentYear: createContributionDto.paymentYear,
        paymentMonth: createContributionDto.paymentMonth,
      },
    });

    if (existingContribution) {
      throw new ConflictException('Contribution already exists for this member and period');
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
      paymentStatus: createContributionDto.paidAmount === createContributionDto.expectedAmount ? PaymentStatus.PAID :
                    createContributionDto.paidAmount > 0 ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.UNPAID,
      paymentDate: createContributionDto.paidAmount > 0 ? new Date() : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedContribution = await this.contributionRepository.save(contribution);

    // Auto-generate receipt reference if not provided
    if (!savedContribution.receiptReference) {
      savedContribution.receiptReference = `#${savedContribution.id.substring(0, 8).toUpperCase()}`;
      await this.contributionRepository.save(savedContribution);
    }

    // Log the creation
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.CREATE,
      entity: AuditEntity.CONTRIBUTION,
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

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: PaymentStatus,
    year?: number,
    month?: number,
  ): Promise<{ contributions: Contribution[]; total: number; page: number; limit: number }> {
    const query = this.contributionRepository.createQueryBuilder('contribution')
      .leftJoinAndSelect('contribution.member', 'member')
      .orderBy('contribution.paymentYear', 'DESC')
      .addOrderBy('contribution.paymentMonth', 'DESC')
      .addOrderBy('contribution.createdAt', 'DESC');

    if (search) {
      query.andWhere(
        '(member.fullNameEnglish ILIKE :search OR member.fullNameAmharic ILIKE :search OR CAST(member.partyId AS TEXT) ILIKE :search)',
        { search: `%${search}%` }
      );
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

    // Auto-generate receipt references for contributions that don't have them
    for (const contribution of contributions) {
      if (!contribution.receiptReference) {
        contribution.receiptReference = `#${contribution.id.substring(0, 8).toUpperCase()}`;
        await this.contributionRepository.save(contribution);
      }
    }

    return { contributions, total, page, limit };
  }

  async findByMember(memberId: string, paymentMonth?: number, paymentYear?: number): Promise<Contribution[]> {
    const whereCondition: any = { memberId };

    if (paymentMonth !== undefined && paymentYear !== undefined) {
      whereCondition.paymentMonth = paymentMonth;
      whereCondition.paymentYear = paymentYear;
    }

    const contributions = await this.contributionRepository.find({
      where: whereCondition,
      relations: ['member'],
      order: { paymentYear: 'DESC', paymentMonth: 'DESC' },
    });

    // Auto-generate receipt references for contributions that don't have them
    for (const contribution of contributions) {
      if (!contribution.receiptReference) {
        contribution.receiptReference = `#${contribution.id.substring(0, 8).toUpperCase()}`;
        await this.contributionRepository.save(contribution);
      }
    }

    return contributions;
  }

  async findOne(id: string): Promise<Contribution> {
    const contribution = await this.contributionRepository.findOne({
      where: { id },
      relations: ['member'],
    });

    if (!contribution) {
      throw new NotFoundException('Contribution not found');
    }

    // Auto-generate receipt reference if not present
    if (!contribution.receiptReference) {
      contribution.receiptReference = `#${contribution.id.substring(0, 8).toUpperCase()}`;
      await this.contributionRepository.save(contribution);
    }

    return contribution;
  }

  async update(id: string, updateContributionDto: UpdateContributionDto, userId: string, username: string): Promise<Contribution> {
    const contribution = await this.findOne(id);

    // Get old values for audit log
    const oldValues = {
      paidAmount: contribution.paidAmount,
      paymentStatus: contribution.paymentStatus,
      paymentMethod: contribution.paymentMethod,
      expectedAmount: contribution.expectedAmount,
    };

    // Update contribution
    Object.assign(contribution, updateContributionDto);

    // Auto-generate receipt reference if not provided and contribution doesn't have one
    if (!contribution.receiptReference) {
      contribution.receiptReference = `#${contribution.id.substring(0, 8).toUpperCase()}`;
    }

    // Update payment status based on paid amount
    if (updateContributionDto.paidAmount !== undefined || updateContributionDto.expectedAmount !== undefined) {
      const paidAmount = updateContributionDto.paidAmount ?? contribution.paidAmount;
      const expectedAmount = updateContributionDto.expectedAmount ?? contribution.expectedAmount;

      contribution.paymentStatus = paidAmount === expectedAmount ? PaymentStatus.PAID :
                                  paidAmount > 0 ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.UNPAID;

      if (paidAmount > 0 && !contribution.paymentDate) {
        contribution.paymentDate = new Date();
      }
    }

    contribution.updatedBy = userId;

    const updatedContribution = await this.contributionRepository.save(contribution);

    // Log the update
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.UPDATE,
      entity: AuditEntity.CONTRIBUTION,
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

  async remove(id: string, userId: string, username: string): Promise<void> {
    const contribution = await this.findOne(id);

    await this.contributionRepository.remove(contribution);

    // Log the deletion
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.DELETE,
      entity: AuditEntity.CONTRIBUTION,
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

  async getContributionStats(): Promise<{
    totalContributions: number;
    totalPaid: number;
    totalExpected: number;
    paidContributions: number;
    partiallyPaidContributions: number;
    unpaidContributions: number;
    monthlyStats: { month: number; year: number; paid: number; expected: number }[];
  }> {
    const contributions = await this.contributionRepository.find();

    const stats = {
      totalContributions: contributions.length,
      totalPaid: 0,
      totalExpected: 0,
      paidContributions: 0,
      partiallyPaidContributions: 0,
      unpaidContributions: 0,
      monthlyStats: [] as { month: number; year: number; paid: number; expected: number }[],
    };

    const monthlyMap = new Map<string, { paid: number; expected: number }>();

    contributions.forEach(contribution => {
      stats.totalPaid += Number(contribution.paidAmount);
      stats.totalExpected += Number(contribution.expectedAmount);

      switch (contribution.paymentStatus) {
        case PaymentStatus.PAID:
          stats.paidContributions++;
          break;
        case PaymentStatus.PARTIALLY_PAID:
          stats.partiallyPaidContributions++;
          break;
        case PaymentStatus.UNPAID:
          stats.unpaidContributions++;
          break;
      }

      // Monthly stats
      const key = `${contribution.paymentYear}-${contribution.paymentMonth}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { paid: 0, expected: 0 });
      }
      const monthly = monthlyMap.get(key)!;
      monthly.paid += Number(contribution.paidAmount);
      monthly.expected += Number(contribution.expectedAmount);
    });

    // Convert monthly map to array
    stats.monthlyStats = Array.from(monthlyMap.entries()).map(([key, data]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, paid: data.paid, expected: data.expected };
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return stats;
  }

  async getMemberContributionSummary(memberId: string): Promise<{
    totalPaid: number;
    totalExpected: number;
    lastPaymentDate?: Date;
    paymentStreak: number;
    status: string;
  }> {
    const contributions = await this.findByMember(memberId);

    const summary = {
      totalPaid: 0,
      totalExpected: 0,
      lastPaymentDate: undefined as Date | undefined,
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

    // Calculate payment streak (consecutive months with payments)
    const sortedContributions = contributions.sort((a, b) => {
      if (a.paymentYear !== b.paymentYear) return b.paymentYear - a.paymentYear;
      return b.paymentMonth - a.paymentMonth;
    });

    let streak = 0;
    for (const contribution of sortedContributions) {
      if (contribution.paidAmount > 0) {
        streak++;
      } else {
        break;
      }
    }
    summary.paymentStreak = streak;

    return summary;
  }

  async generateMonthlyContributions(month: number, year: number, userId: string, username: string) {
    // Check if contributions already exist for this period
    const existingCount = await this.contributionRepository.count({
      where: {
        paymentMonth: month,
        paymentYear: year,
      },
    });

    if (existingCount > 0) {
      throw new ConflictException(`Contributions for ${month}/${year} already exist`);
    }

    // Get all active members
    const activeMembers = await this.memberRepository.find({
      where: { membershipStatus: MembershipStatus.MEMBER },
    });

    if (activeMembers.length === 0) {
      throw new NotFoundException('No active members found');
    }

    // Get contribution rules to determine expected amounts
    // For now, use a default amount. In a real system, this would come from contribution rules
    const defaultAmount = 100; // ETB

    const contributions: Contribution[] = [];
    for (const member of activeMembers) {
      const contribution = this.contributionRepository.create({
        memberId: member.id,
        member,
        paymentMonth: month,
        paymentYear: year,
        contributionType: ContributionType.FIXED_AMOUNT,
        expectedAmount: defaultAmount,
        paidAmount: 0,
        paymentStatus: PaymentStatus.UNPAID,
        createdBy: userId,
      });
      contributions.push(contribution);
    }

    const savedContributions = await this.contributionRepository.save(contributions);

    // Log the generation
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.CREATE,
      entity: AuditEntity.CONTRIBUTION,
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

  async generateContributionPDF(contributionId: string): Promise<Buffer> {
    const contribution = await this.contributionRepository.findOne({
      where: { id: contributionId },
      relations: ['member'],
    });

    if (!contribution) {
      throw new NotFoundException('Contribution not found');
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

    // Generate PDF using Puppeteer
    // Try to use system Chrome first, fallback to Puppeteer's bundled Chrome
    let browser;
    try {
      browser = await puppeteer.launch({
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
    } catch (error: any) {
      // If Chrome is not found, try to use system Chrome
      const possibleChromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.CHROME_PATH,
      ].filter(Boolean);

      let browserLaunched = false;
      for (const chromePath of possibleChromePaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(chromePath)) {
            browser = await puppeteer.launch({
              headless: true,
              executablePath: chromePath,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
              ]
            });
            browserLaunched = true;
            break;
          }
        } catch (pathError) {
          continue;
        }
      }

      if (!browserLaunched) {
        throw new NotFoundException(
          'Chrome browser not found. Please install Chrome or set CHROME_PATH environment variable.\n' +
          'To install Chrome for Puppeteer, run: npx puppeteer browsers install chrome\n' +
          'Or install Google Chrome and set CHROME_PATH to the chrome.exe path.'
        );
      }
    }

    try {
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

      return Buffer.from(pdfBuffer);
    } finally {
      // Always close the browser, even if there's an error
      if (browser) {
        await browser.close().catch(console.error);
      }
    }
  }

  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  }

  async generateBulkPaidContributions(month: number, year: number, userId: string, username: string) {
    // Get all active members (membershipStatus = 'member' AND status = 'active')
    const activeMembers = await this.memberRepository.find({
      where: {
        membershipStatus: MembershipStatus.MEMBER,
        status: Status.ACTIVE
      },
    });

    if (activeMembers.length === 0) {
      throw new NotFoundException('No active members found');
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const member of activeMembers) {
      try {
        // Check if contribution already exists for this member and period
        const existingContribution = await this.contributionRepository.findOne({
          where: {
            memberId: member.id,
            paymentMonth: month,
            paymentYear: year,
          },
        });

        if (existingContribution) {
          skipped++;
          continue;
        }

        // Calculate contribution amount based on salary and contribution percentage
        const salaryAmount = typeof member.salaryAmount === 'number'
          ? member.salaryAmount
          : parseFloat(member.salaryAmount || '0') || 0;
        const contributionPercentage = member.contributionPercentage;

        // If percentage is null or 0, use 1%
        const effectivePercentage = (contributionPercentage !== null && contributionPercentage !== undefined && contributionPercentage !== 0)
          ? contributionPercentage
          : 1;

        const calculatedAmount = Math.round((salaryAmount * effectivePercentage) / 100);

        // Create paid contribution
        const contribution = this.contributionRepository.create({
          memberId: member.id,
          member,
          paymentMonth: month,
          paymentYear: year,
          contributionType: ContributionType.PERCENTAGE_OF_SALARY,
          expectedAmount: calculatedAmount,
          paidAmount: calculatedAmount,
          paymentStatus: PaymentStatus.PAID,
          createdBy: userId,
        });

        await this.contributionRepository.save(contribution);
        created++;

      } catch (error: any) {
        errors.push(`Failed to create contribution for ${member.fullNameEnglish}: ${error.message}`);
      }
    }

    // Log the bulk generation
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.CREATE,
      entity: AuditEntity.CONTRIBUTION,
      entityId: `bulk-${month}-${year}`,
      newValues: { created, skipped, totalMembers: activeMembers.length },
    });

    return {
      message: `Bulk generation completed for ${month}/${year}`,
      statistics: {
        totalMembers: activeMembers.length,
        created,
        skipped,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
