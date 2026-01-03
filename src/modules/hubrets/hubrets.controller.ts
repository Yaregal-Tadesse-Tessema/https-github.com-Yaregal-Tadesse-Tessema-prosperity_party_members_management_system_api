import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { HubretsService, CreateHubretDto, UpdateHubretDto } from './hubrets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('hubrets')
@UseGuards(JwtAuthGuard)
export class HubretsController {
  constructor(private readonly hubretsService: HubretsService) {}

  @Post()
  create(@Body() createHubretDto: CreateHubretDto, @Request() req) {
    return this.hubretsService.create(createHubretDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.hubretsService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.hubretsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hubretsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHubretDto: UpdateHubretDto, @Request() req) {
    return this.hubretsService.update(id, updateHubretDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.hubretsService.remove(id, req.user.id);
  }

  @Get(':hubretId/families/:familyId/check')
  checkFamilyAssignment(
    @Param('hubretId') hubretId: string,
    @Param('familyId') familyId: string,
  ) {
    return this.hubretsService.checkFamilyAssignment(familyId, hubretId);
  }

  @Post(':hubretId/families/:familyId')
  assignFamilyToHubret(
    @Param('hubretId') hubretId: string,
    @Param('familyId') familyId: string,
    @Request() req
  ) {
    return this.hubretsService.assignFamilyToHubret(familyId, hubretId, req.user.id);
  }

  @Delete(':hubretId/families/:familyId')
  removeFamilyFromHubret(
    @Param('hubretId') hubretId: string,
    @Param('familyId') familyId: string,
    @Request() req
  ) {
    return this.hubretsService.assignFamilyToHubret(familyId, null, req.user.id);
  }
}
