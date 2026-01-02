import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // More specific routes first to avoid conflicts
  @Get('members-by-education')
  async getMemberByEducationReport() {
    return this.reportsService.getMemberByEducationReport();
  }

  @Get('members-by-gender')
  async getMemberByGenderReport() {
    return this.reportsService.getMemberByGenderReport();
  }

  @Get('members-by-position')
  async getMemberByPositionReport() {
    return this.reportsService.getMemberByPositionReport();
  }

  @Get('outstanding-contributions')
  async getOutstandingContributions() {
    return this.reportsService.getOutstandingContributions();
  }

  @Get('dashboard')
  async getComprehensiveDashboard() {
    return this.reportsService.getComprehensiveDashboard();
  }

  @Get('export/members')
  async exportMemberReport(
    @Query('format') format: string = 'json',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subCity') subCity?: string,
    @Query('woreda') woreda?: string,
    @Query('membershipStatus') membershipStatus?: string,
    @Query('gender') gender?: string,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      subCity,
      woreda,
      membershipStatus: membershipStatus as any,
      gender: gender as any,
    };

    const report = await this.reportsService.getMemberReport(filters);

    // For now, return JSON. In a real implementation, you'd generate CSV, PDF, etc.
    return {
      format,
      data: report,
      generatedAt: new Date().toISOString(),
    };
  }

  @Get('export/contributions')
  async exportContributionReport(
    @Query('format') format: string = 'json',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      paymentStatus: paymentStatus as any,
    };

    const report = await this.reportsService.getContributionReport(filters);

    // For now, return JSON. In a real implementation, you'd generate CSV, PDF, etc.
    return {
      format,
      data: report,
      generatedAt: new Date().toISOString(),
    };
  }

  // Less specific routes last
  @Get('members')
  async getMemberReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subCity') subCity?: string,
    @Query('woreda') woreda?: string,
    @Query('membershipStatus') membershipStatus?: string,
    @Query('gender') gender?: string,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      subCity,
      woreda,
      membershipStatus: membershipStatus as any,
      gender: gender as any,
    };

    return this.reportsService.getMemberReport(filters);
  }

  @Get('positions')
  async getPositionReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('positionLevel') positionLevel?: string,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      positionLevel: positionLevel as any,
    };

    return this.reportsService.getPositionReport(filters);
  }

  @Get('contributions')
  async getContributionReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      paymentStatus: paymentStatus as any,
    };

    return this.reportsService.getContributionReport(filters);
  }
}




