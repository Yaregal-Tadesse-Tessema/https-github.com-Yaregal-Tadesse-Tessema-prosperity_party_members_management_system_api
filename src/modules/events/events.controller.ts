import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { EventsService, CreateEventDto, UpdateEventDto } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ADMIN_ROLES = ['system_admin', 'party_admin', 'data_entry_officer'];

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() dto: CreateEventDto, @Request() req) {
    this.requireAdmin(req.user);
    return this.eventsService.create(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.eventsService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto, @Request() req) {
    this.requireAdmin(req.user);
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    this.requireAdmin(req.user);
    await this.eventsService.remove(id);
    return { message: 'Event deleted successfully' };
  }

  private requireAdmin(user: any): void {
    if (!user?.role || !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
