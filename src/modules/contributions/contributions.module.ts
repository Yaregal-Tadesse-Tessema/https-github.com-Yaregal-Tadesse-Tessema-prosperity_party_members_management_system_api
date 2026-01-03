import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contribution } from '../../entities/contribution.entity';
import { Member } from '../../entities/member.entity';
import { ContributionsService } from './contributions.service';
import { ContributionsController } from './contributions.controller';
import { AuditLogModule } from '../audit/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contribution, Member]),
    AuditLogModule,
  ],
  controllers: [ContributionsController],
  providers: [ContributionsService],
  exports: [ContributionsService],
})
export class ContributionsModule {}







