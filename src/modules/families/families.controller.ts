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
import { FamiliesService, CreateFamilyDto, UpdateFamilyDto } from './families.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../../entities/user.entity';

const ALLOWED_ROLES_CREATE_UPDATE = [UserRole.SYSTEM_ADMIN, UserRole.PARTY_ADMIN, UserRole.DATA_ENTRY_OFFICER];
const ALLOWED_ROLES_DELETE = [UserRole.SYSTEM_ADMIN, UserRole.PARTY_ADMIN];

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  private checkPermission(user: any, allowedRoles: UserRole[]) {
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private hasRole(user: any, roles: UserRole[]): boolean {
    return roles.includes(user.role);
  }

  @Post()
  async create(@Body() createFamilyDto: CreateFamilyDto, @Request() req) {
    this.checkPermission(req.user, ALLOWED_ROLES_CREATE_UPDATE);
    return this.familiesService.create(createFamilyDto, req.user.id, req.user.username);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    return this.familiesService.findAll(pageNum, limitNum, search, status as any);
  }

  @Get('stats')
  async getStats() {
    return this.familiesService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.familiesService.findOne(id);
  }

  @Get('by-family-id/:familyId')
  async findByFamilyId(@Param('familyId') familyId: string) {
    return this.familiesService.findByFamilyId(familyId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateFamilyDto: UpdateFamilyDto, @Request() req) {
    this.checkPermission(req.user, ALLOWED_ROLES_CREATE_UPDATE);
    return this.familiesService.update(id, updateFamilyDto, req.user.id, req.user.username);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    this.checkPermission(req.user, ALLOWED_ROLES_DELETE);
    return this.familiesService.remove(id, req.user.id, req.user.username);
  }
}
