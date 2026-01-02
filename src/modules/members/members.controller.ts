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
  Request,
  ForbiddenException,
} from '@nestjs/common';
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

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
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

  private checkPermission(user: any, allowedRoles: string[]) {
    if (!this.hasRole(user, allowedRoles)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private hasRole(user: any, roles: string[]): boolean {
    return roles.includes(user.role);
  }
}
