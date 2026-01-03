import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from '../../entities/family.entity';
import { Member } from '../../entities/member.entity';
import { Hubret } from '../../entities/hubret.entity';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { AuditLogModule } from '../audit/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Family, Member, Hubret]),
    AuditLogModule,
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
