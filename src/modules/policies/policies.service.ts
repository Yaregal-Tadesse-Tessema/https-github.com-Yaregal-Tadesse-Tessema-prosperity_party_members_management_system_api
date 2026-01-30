import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyDocument } from '../../entities/policy-document.entity';

export interface CreatePolicyDto {
  title: string;
  description?: string;
  fileUrl?: string;
  category?: string;
}

export interface UpdatePolicyDto {
  title?: string;
  description?: string;
  fileUrl?: string;
  category?: string;
}

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(PolicyDocument)
    private policyRepository: Repository<PolicyDocument>,
  ) {}

  async create(dto: CreatePolicyDto, userId: string): Promise<PolicyDocument> {
    const doc = this.policyRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.policyRepository.save(doc);
  }

  async findAll(page: number = 1, limit: number = 20, category?: string): Promise<{ items: PolicyDocument[]; total: number; page: number; limit: number }> {
    const qb = this.policyRepository.createQueryBuilder('p').orderBy('p.createdAt', 'DESC');
    if (category) {
      qb.andWhere('p.category = :category', { category });
    }
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<PolicyDocument> {
    const doc = await this.policyRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Policy document not found');
    }
    return doc;
  }

  async update(id: string, dto: UpdatePolicyDto): Promise<PolicyDocument> {
    const doc = await this.findOne(id);
    Object.assign(doc, dto);
    return this.policyRepository.save(doc);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.findOne(id);
    await this.policyRepository.remove(doc);
  }
}
