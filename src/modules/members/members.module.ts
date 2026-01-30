import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../../entities/member.entity';
import { User } from '../../entities/user.entity';
import { EmploymentInfo } from '../../entities/employment-info.entity';
import { FileAttachment } from '../../entities/file-attachment.entity';
import { Contribution } from '../../entities/contribution.entity';
import { PositionHistory } from '../../entities/position-history.entity';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { AuditLogModule } from '../audit/audit-log.module';
import { FamiliesModule } from '../families/families.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, User, EmploymentInfo, FileAttachment, Contribution, PositionHistory]),
    AuditLogModule,
    FamiliesModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}




