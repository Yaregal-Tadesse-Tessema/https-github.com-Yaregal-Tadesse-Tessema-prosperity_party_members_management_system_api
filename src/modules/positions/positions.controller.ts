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
} from '@nestjs/common';
import { PositionsService, CreatePositionDto, UpdatePositionDto } from './positions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  async create(@Body() createPositionDto: CreatePositionDto, @Request() req) {
    return this.positionsService.create(createPositionDto, req.user.id, req.user.username);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('level') level?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    return this.positionsService.findAll(pageNum, limitNum, search, level as any, status as any);
  }

  @Get('stats')
  async getStats() {
    return this.positionsService.getPositionStats();
  }

  @Get('member/:memberId')
  async findByMember(@Param('memberId') memberId: string) {
    return this.positionsService.findByMember(memberId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.positionsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
    @Request() req,
  ) {
    return this.positionsService.update(id, updatePositionDto, req.user.id, req.user.username);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.positionsService.remove(id, req.user.id, req.user.username);
    return { message: 'Position deleted successfully' };
  }
}







