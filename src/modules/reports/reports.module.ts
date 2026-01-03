import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../../entities/member.entity';
import { PositionHistory } from '../../entities/position-history.entity';
import { Contribution } from '../../entities/contribution.entity';
import { EmploymentInfo } from '../../entities/employment-info.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, PositionHistory, Contribution, EmploymentInfo]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}







