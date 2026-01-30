import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyDocument } from '../../entities/policy-document.entity';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PolicyDocument])],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
