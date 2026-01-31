import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PoliciesService, CreatePolicyDto, UpdatePolicyDto } from './policies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ADMIN_ROLES = ['system_admin', 'party_admin', 'data_entry_officer'];

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  create(@Body() dto: CreatePolicyDto, @Request() req) {
    this.requireAdmin(req.user);
    return this.policiesService.create(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') category?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.policiesService.findAll(pageNum, limitNum, category);
  }

  @Post(':id/files')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  uploadFiles(
    @Param('id') id: string,
    @UploadedFiles() uploaded: { files?: Express.Multer.File[] },
    @Request() req,
  ) {
    this.requireAdmin(req.user);
    const list = uploaded?.files || [];
    if (list.length === 0) {
      return this.policiesService.findOne(id);
    }
    return this.policiesService.uploadFiles(id, list);
  }

  @Delete(':id/files')
  removeFile(
    @Param('id') id: string,
    @Body('url') url: string,
    @Request() req,
  ) {
    this.requireAdmin(req.user);
    return this.policiesService.removeFile(id, url);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePolicyDto, @Request() req) {
    this.requireAdmin(req.user);
    return this.policiesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    this.requireAdmin(req.user);
    await this.policiesService.remove(id);
    return { message: 'Policy document deleted successfully' };
  }

  private requireAdmin(user: any): void {
    if (!user?.role || !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
