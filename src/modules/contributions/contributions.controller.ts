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
  Response,
} from '@nestjs/common';
import { ContributionsService, CreateContributionDto, UpdateContributionDto } from './contributions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contributions')
@UseGuards(JwtAuthGuard)
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Post()
  async create(@Body() createContributionDto: CreateContributionDto, @Request() req) {
    return this.contributionsService.create(createContributionDto, req.user.id, req.user.username);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const yearNum = year ? parseInt(year) : undefined;
    const monthNum = month ? parseInt(month) : undefined;

    return this.contributionsService.findAll(pageNum, limitNum, search, status as any, yearNum, monthNum);
  }

  @Get('stats')
  async getStats() {
    return this.contributionsService.getContributionStats();
  }

  @Get('member/:memberId')
  async findByMember(
    @Param('memberId') memberId: string,
    @Query('paymentMonth') paymentMonth?: number,
    @Query('paymentYear') paymentYear?: number
  ) {
    return this.contributionsService.findByMember(memberId, paymentMonth, paymentYear);
  }

  @Get('member/:memberId/summary')
  async getMemberSummary(@Param('memberId') memberId: string) {
    return this.contributionsService.getMemberContributionSummary(memberId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contributionsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContributionDto: UpdateContributionDto,
    @Request() req,
  ) {
    return this.contributionsService.update(id, updateContributionDto, req.user.id, req.user.username);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.contributionsService.remove(id, req.user.id, req.user.username);
    return { message: 'Contribution deleted successfully' };
  }

  @Post('generate')
  async generateContributions(@Body() generateDto: { month: number; year: number }, @Request() req) {
    return this.contributionsService.generateMonthlyContributions(generateDto.month, generateDto.year, req.user.id, req.user.username);
  }

  @Post('generate-bulk')
  async generateBulkContributions(@Body() generateDto: { month: number; year: number }, @Request() req) {
    return this.contributionsService.generateBulkPaidContributions(generateDto.month, generateDto.year, req.user.id, req.user.username);
  }

  @Get(':id/pdf')
  async downloadPDF(@Param('id') id: string, @Request() req, @Response() res) {
    try {
      const pdfBuffer = await this.contributionsService.generateContributionPDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contribution-${id}.pdf"`);

      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      if (error.message && error.message.includes('Chrome')) {
        return res.status(500).json({
          message: 'PDF generation failed: Chrome browser not found. Please install Chrome or set CHROME_PATH environment variable.',
          error: 'ChromeNotFound',
          details: 'To install Chrome for Puppeteer, run: npx puppeteer browsers install chrome'
        });
      }
      return res.status(500).json({
        message: error.message || 'Failed to generate PDF',
        error: 'PDFGenerationError'
      });
    }
  }
}


