import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family, FamilyType, FamilyStatus } from '../../entities/family.entity';
import { Member, Gender, MembershipStatus } from '../../entities/member.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';

export interface CreateFamilyDto {
  familyId: string;
  familyNameAmharic: string;
  familyNameEnglish: string;
  familyType?: FamilyType;
  contactMemberId?: string;
  notes?: string;
}

export interface UpdateFamilyDto {
  familyNameAmharic?: string;
  familyNameEnglish?: string;
  familyType?: FamilyType;
  status?: FamilyStatus;
  headMemberId?: string;
  contactMemberId?: string;
  notes?: string;
}

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private auditLogService: AuditLogService,
  ) {}

  async create(createFamilyDto: CreateFamilyDto, userId: string, username: string): Promise<Family> {
    // Check if family ID already exists
    const existingFamily = await this.familyRepository.findOne({
      where: { familyId: createFamilyDto.familyId },
    });

    if (existingFamily) {
      throw new ConflictException('Family ID already exists');
    }

    const family = this.familyRepository.create({
      ...createFamilyDto,
      familyType: createFamilyDto.familyType || FamilyType.NUCLEAR,
      status: FamilyStatus.ACTIVE,
      totalMembers: 0,
      activeMembers: 0,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedFamily = await this.familyRepository.save(family);

    // Log the creation
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.CREATE,
      entity: AuditEntity.MEMBER, // Using MEMBER as we don't have FAMILY in audit entity yet
      entityId: savedFamily.id,
      newValues: { familyId: savedFamily.familyId, familyNameEnglish: savedFamily.familyNameEnglish },
      notes: 'Family registration',
    });

    return savedFamily;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: FamilyStatus
  ): Promise<{ families: Family[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.familyRepository.createQueryBuilder('family');

    if (search) {
      queryBuilder.where(
        '(family.familyNameAmharic LIKE :search OR family.familyNameEnglish LIKE :search OR family.familyId LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('family.status = :status', { status });
    }

    queryBuilder
      .orderBy('family.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [families, total] = await queryBuilder.getManyAndCount();

    return {
      families,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Family> {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return family;
  }

  async findByFamilyId(familyId: string): Promise<Family> {
    const family = await this.familyRepository.findOne({
      where: { familyId },
      relations: ['members'],
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return family;
  }

  async update(id: string, updateFamilyDto: UpdateFamilyDto, userId: string, username: string): Promise<Family> {
    const family = await this.findOne(id);

    const oldValues = {
      familyNameEnglish: family.familyNameEnglish,
      familyType: family.familyType,
      status: family.status,
    };

    // Update family
    Object.assign(family, updateFamilyDto);
    family.updatedBy = userId;

    const savedFamily = await this.familyRepository.save(family);

    // Log the update
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.UPDATE,
      entity: AuditEntity.MEMBER, // Using MEMBER as we don't have FAMILY in audit entity yet
      entityId: savedFamily.id,
      oldValues,
      newValues: updateFamilyDto,
      notes: 'Family update',
    });

    return savedFamily;
  }

  async remove(id: string, userId: string, username: string): Promise<void> {
    const family = await this.findOne(id);

    // Check if family has members
    if (family.members && family.members.length > 0) {
      throw new BadRequestException('Cannot delete family with active members. Please remove all members first.');
    }

    await this.familyRepository.remove(family);

    // Log the deletion
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.DELETE,
      entity: AuditEntity.MEMBER, // Using MEMBER as we don't have FAMILY in audit entity yet
      entityId: id,
      oldValues: { familyId: family.familyId, familyNameEnglish: family.familyNameEnglish },
      notes: 'Family deletion',
    });
  }

  async getStats(): Promise<{
    totalFamilies: number;
    activeFamilies: number;
    nuclearFamilies: number;
    extendedFamilies: number;
    totalMaleMembers: number;
    totalFemaleMembers: number;
    activeMaleMembers: number;
    activeFemaleMembers: number;
    inactiveMaleMembers: number;
    inactiveFemaleMembers: number;
  }> {
    const [totalFamilies, activeFamilies, nuclearFamilies, extendedFamilies] = await Promise.all([
      this.familyRepository.count(),
      this.familyRepository.count({ where: { status: FamilyStatus.ACTIVE } }),
      this.familyRepository.count({ where: { familyType: FamilyType.NUCLEAR } }),
      this.familyRepository.count({ where: { familyType: FamilyType.EXTENDED } }),
    ]);

    // Get gender statistics for all members in families
    const allMembers = await this.memberRepository
      .createQueryBuilder('member')
      .where('member.familyId IS NOT NULL')
      .getMany();

    const totalMaleMembers = allMembers.filter(m => m.gender === Gender.MALE).length;
    const totalFemaleMembers = allMembers.filter(m => m.gender === Gender.FEMALE).length;

    const activeMembers = allMembers.filter(m => m.membershipStatus === MembershipStatus.MEMBER);
    const activeMaleMembers = activeMembers.filter(m => m.gender === Gender.MALE).length;
    const activeFemaleMembers = activeMembers.filter(m => m.gender === Gender.FEMALE).length;

    const inactiveMembers = allMembers.filter(m => m.membershipStatus === MembershipStatus.SUPPORTIVE_MEMBER);
    const inactiveMaleMembers = inactiveMembers.filter(m => m.gender === Gender.MALE).length;
    const inactiveFemaleMembers = inactiveMembers.filter(m => m.gender === Gender.FEMALE).length;

    return {
      totalFamilies,
      activeFamilies,
      nuclearFamilies,
      extendedFamilies,
      totalMaleMembers,
      totalFemaleMembers,
      activeMaleMembers,
      activeFemaleMembers,
      inactiveMaleMembers,
      inactiveFemaleMembers,
    };
  }

  async updateMemberCount(familyId: string): Promise<void> {
    const family = await this.familyRepository.findOne({
      where: { id: familyId },
      relations: ['members'],
    });

    if (!family) return;

    const totalMembers = family.members?.length || 0;
    const activeMembers = family.members?.filter(member =>
      member.membershipStatus === MembershipStatus.MEMBER
    ).length || 0;

    await this.familyRepository.update(familyId, {
      totalMembers,
      activeMembers,
    });
  }
}
