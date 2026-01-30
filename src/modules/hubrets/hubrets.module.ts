import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubretsService } from './hubrets.service';
import { HubretsController } from './hubrets.controller';
import { Hubret } from '../../entities/hubret.entity';
import { Family } from '../../entities/family.entity';
import { Commission } from '../../entities/commission.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditLog } from '../../entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hubret, Family, Commission, AuditLog])],
  providers: [HubretsService, AuditLogService],
  controllers: [HubretsController],
  exports: [HubretsService],
})
export class HubretsModule {}
