import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Response,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as ExpressResponse } from 'express';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';
import { MembersService, CreateMemberDto, UpdateMemberDto, CreateEmploymentDto } from './members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../../entities/user.entity';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  async create(@Body() createMemberDto: CreateMemberDto, @Request() req) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    return this.membersService.create(createMemberDto, req.user.id, req.user.username);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('membershipStatus') membershipStatus?: string,
    @Query('status') status?: string,
    @Query('gender') gender?: string,
    @Query('subCity') subCity?: string,
    @Query('familyId') familyId?: string,
  ) {
    this.rejectMemberRole(req.user);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Finance officers and above can see salary info, data entry officers can also see for data entry purposes
    const canViewSalary = this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer']);

    console.log('Members API called with filters:', { page: pageNum, limit: limitNum, search, membershipStatus, status, gender, subCity, familyId });
    const result = await this.membersService.findAll(pageNum, limitNum, search, membershipStatus as any, status as any, gender as any, subCity, familyId);
    console.log('Members API returned:', { count: result.members.length, total: result.total });

    // If user cannot view salary, remove salary information from response
    if (!canViewSalary) {
      result.members = result.members.map(member => {
        if (member.employmentHistory) {
          member.employmentHistory = member.employmentHistory.map(emp => {
            const { monthlySalary, ...rest } = emp;
            return rest as any;
          });
        }
        return member;
      });
    }

    return result;
  }

  @Get('stats')
  async getStats(@Request() req) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer', 'read_only_viewer']);
    return this.membersService.getMemberStats();
  }

  @Get('me')
  async getMe(@Request() req) {
    const canViewSalary = this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer']);
    const member = await this.membersService.findMe(req.user.id);
    if (!canViewSalary && member.employmentHistory) {
      member.employmentHistory = member.employmentHistory.map((emp: any) => {
        const { monthlySalary, ...rest } = emp;
        return rest;
      });
    }
    return member;
  }

  @Post('sync-users')
  async syncUsers(@Request() req) {
    this.checkPermission(req.user, ['system_admin', 'party_admin']);
    return this.membersService.syncUsersFromMembers();
  }

  @Post(':id/sync-user')
  async syncUser(@Param('id') id: string, @Request() req) {
    this.checkPermission(req.user, ['system_admin', 'party_admin']);
    return this.membersService.syncUserFromMember(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    this.rejectMemberRole(req.user);
    const canViewSalary = this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer']);
    const member = await this.membersService.findOne(id);

    // If user cannot view salary, remove salary information from response
    if (!canViewSalary && member.employmentHistory) {
      member.employmentHistory = member.employmentHistory.map(emp => {
        const { monthlySalary, ...rest } = emp;
        return rest as any;
      });
    }

    return member;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    return this.membersService.update(id, updateMemberDto, req.user.id, req.user.username);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    console.log(`[DELETE] Delete member request for ID: ${id}`, {
      userId: req.user?.id,
      username: req.user?.username,
      role: req.user?.role,
    });
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    await this.membersService.delete(id, req.user.id, req.user.username);
    return { message: 'Member deleted successfully' };
  }

  @Post(':id/employment')
  async createEmployment(
    @Param('id') id: string,
    @Body() employmentDto: CreateEmploymentDto,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);

    // Only finance officers and above can set salary information
    if (employmentDto.monthlySalary && !this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer'])) {
      throw new ForbiddenException('Insufficient permissions to set salary information');
    }

    return this.membersService.createEmploymentInfo(id, employmentDto, req.user.id, req.user.username);
  }

  @Get(':id/employment')
  async getEmploymentHistory(@Param('id') id: string, @Request() req) {
    const canViewSalary = this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer']);
    const history = await this.membersService.getEmploymentHistory(id);

    // If user cannot view salary, remove salary information from response
    if (!canViewSalary) {
      return history.map(emp => {
        const { monthlySalary, ...rest } = emp;
        return rest;
      });
    }

    return history;
  }

  @Put(':id/employment/:employmentId')
  async updateEmployment(
    @Param('id') id: string,
    @Param('employmentId') employmentId: string,
    @Body() employmentDto: CreateEmploymentDto,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);

    // Only finance officers and above can update salary information
    if (employmentDto.monthlySalary && !this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer'])) {
      throw new ForbiddenException('Insufficient permissions to update salary information');
    }

    return this.membersService.updateEmploymentInfo(id, employmentId, employmentDto, req.user.id, req.user.username);
  }

  @Put(':id/employment')
  async updateEmploymentLegacy(
    @Param('id') id: string,
    @Body() employmentDto: CreateEmploymentDto,
    @Request() req,
  ) {
    // Legacy endpoint - creates a new employment record if none exists, or updates the first one
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);

    if (employmentDto.monthlySalary && !this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer'])) {
      throw new ForbiddenException('Insufficient permissions to update salary information');
    }

    const member = await this.membersService.findOne(id);
    if (member.employmentHistory && member.employmentHistory.length > 0) {
      // Update the first (current) employment record
      return this.membersService.updateEmploymentInfo(id, member.employmentHistory[0].id, employmentDto, req.user.id, req.user.username);
    } else {
      // Create a new employment record
      return this.membersService.createEmploymentInfo(id, employmentDto, req.user.id, req.user.username);
    }
  }

  @Delete(':id/employment/:employmentId')
  async deleteEmployment(
    @Param('id') id: string,
    @Param('employmentId') employmentId: string,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    await this.membersService.deleteEmploymentInfo(id, employmentId, req.user.id, req.user.username);
    return { message: 'Employment record deleted successfully' };
  }

  @Post(':id/upload-educational-documents')
  @UseInterceptors(FileInterceptor('educationalDocumentsFile'))
  async uploadEducationalDocuments(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    return this.membersService.uploadEducationalDocuments(id, file, req.user.id, req.user.username);
  }

  @Post(':id/upload-experience-documents')
  @UseInterceptors(FileInterceptor('experienceDocumentsFile'))
  async uploadExperienceDocuments(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    return this.membersService.uploadExperienceDocuments(id, file, req.user.id, req.user.username);
  }

  @Get(':id/educational-documents')
  async downloadEducationalDocuments(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const fileBuffer = await this.membersService.downloadEducationalDocuments(id);

    if (!fileBuffer) {
      return res.status(404).json({ message: 'Educational documents not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="educational-documents-${id}.pdf"`);
    res.send(fileBuffer);
  }

  @Get(':id/experience-documents')
  async downloadExperienceDocuments(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const fileBuffer = await this.membersService.downloadExperienceDocuments(id);

    if (!fileBuffer) {
      return res.status(404).json({ message: 'Experience documents not found' });
    }

    const member = await this.membersService.findOne(id);
    const fileExtension = member?.experienceDocumentsFile?.split('.').pop() || 'pdf';
    let mimeType = 'application/octet-stream';

    switch (fileExtension.toLowerCase()) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'doc':
        mimeType = 'application/msword';
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="experience-documents-${id}.${fileExtension}"`);
    res.send(fileBuffer);
  }

  @Delete(':id/delete-educational-documents')
  async deleteEducationalDocuments(
    @Param('id') id: string,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    return this.membersService.deleteEducationalDocuments(id, req.user.id, req.user.username);
  }

  @Delete(':id/delete-experience-documents')
  async deleteExperienceDocuments(
    @Param('id') id: string,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    return this.membersService.deleteExperienceDocuments(id, req.user.id, req.user.username);
  }

  @Post('export/pdf')
  async exportMembersPDF(
    @Body() filters: any,
    @Request() req,
    @Response() res: ExpressResponse,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer', 'finance_officer']);

    const members = await this.membersService.getFilteredMembers(filters);
    const pdfBuffer = await this.membersService.generateMembersPDF(members);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="members_report_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  }

  @Post('export/excel')
  async exportMembersExcel(
    @Body() filters: any,
    @Request() req,
    @Response() res: ExpressResponse,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer', 'finance_officer']);

    const members = await this.membersService.getFilteredMembers(filters);
    const excelBuffer = await this.membersService.generateMembersExcel(members);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="members_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
  }

  private checkPermission(user: any, allowedRoles: string[]) {
    if (!this.hasRole(user, allowedRoles)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private hasRole(user: any, roles: string[]): boolean {
    return roles.includes(user.role);
  }

  private rejectMemberRole(user: any): void {
    if (user?.role === 'member') {
      throw new ForbiddenException('Members can only access their own profile via My profile');
    }
  }
}
