import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionHistory } from '../../entities/position-history.entity';
import { Member } from '../../entities/member.entity';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { AuditLogModule } from '../audit/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PositionHistory, Member]),
    AuditLogModule,
  ],
  controllers: [PositionsController],
  providers: [PositionsService],
  exports: [PositionsService],
})
export class PositionsModule {}






