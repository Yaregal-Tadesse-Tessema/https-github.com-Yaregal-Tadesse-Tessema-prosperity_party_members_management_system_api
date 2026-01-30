import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { NewsService, CreateNewsDto, UpdateNewsDto } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ADMIN_ROLES = ['system_admin', 'party_admin', 'data_entry_officer'];

@Controller('news')
@UseGuards(JwtAuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  create(@Body() dto: CreateNewsDto, @Request() req) {
    this.requireAdmin(req.user);
    return this.newsService.create(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.newsService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto, @Request() req) {
    this.requireAdmin(req.user);
    return this.newsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    this.requireAdmin(req.user);
    await this.newsService.remove(id);
    return { message: 'News deleted successfully' };
  }

  private requireAdmin(user: any): void {
    if (!user?.role || !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
