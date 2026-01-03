import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Member } from '../entities/member.entity';
import { Contribution } from '../entities/contribution.entity';
import { EmploymentInfo } from '../entities/employment-info.entity';
import { PositionHistory } from '../entities/position-history.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, Contribution, EmploymentInfo, PositionHistory, User]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}




