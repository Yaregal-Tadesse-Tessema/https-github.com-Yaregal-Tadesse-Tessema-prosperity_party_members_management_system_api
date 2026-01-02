import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../../entities/member.entity';
import { EmploymentInfo } from '../../entities/employment-info.entity';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { AuditLogModule } from '../audit/audit-log.module';
import { FamiliesModule } from '../families/families.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, EmploymentInfo]),
    AuditLogModule,
    FamiliesModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}




