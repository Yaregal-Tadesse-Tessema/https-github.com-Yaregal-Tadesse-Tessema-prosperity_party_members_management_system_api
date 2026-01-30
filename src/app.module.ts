import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Member } from './entities/member.entity';
import { EmploymentInfo } from './entities/employment-info.entity';
import { PositionHistory } from './entities/position-history.entity';
import { Contribution } from './entities/contribution.entity';
import { ContributionRule } from './entities/contribution-rule.entity';
import { FileAttachment } from './entities/file-attachment.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Family } from './entities/family.entity';
import { Hubret } from './entities/hubret.entity';
import { Commission } from './entities/commission.entity';
import { News } from './entities/news.entity';
import { PolicyDocument } from './entities/policy-document.entity';
import { Event } from './entities/event.entity';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogModule } from './modules/audit/audit-log.module';
import { MembersModule } from './modules/members/members.module';
import { PositionsModule } from './modules/positions/positions.module';
import { ContributionsModule } from './modules/contributions/contributions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FilesModule } from './modules/files/files.module';
import { FamiliesModule } from './modules/families/families.module';
import { HubretsModule } from './modules/hubrets/hubrets.module';
import { NewsModule } from './modules/news/news.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { EventsModule } from './modules/events/events.module';
import { SeederModule } from './seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '196.189.124.228',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'prosperity_party_members_management_system_dev',
      entities: [
        User,
        Member,
        EmploymentInfo,
        PositionHistory,
        Contribution,
        ContributionRule,
        FileAttachment,
        AuditLog,
        Family,
        Hubret,
        Commission,
        News,
        PolicyDocument,
        Event,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    AuditLogModule,
    MembersModule,
    PositionsModule,
    ContributionsModule,
    ReportsModule,
    FilesModule,
    FamiliesModule,
    HubretsModule,
    NewsModule,
    PoliciesModule,
    EventsModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
