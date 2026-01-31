import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family, FamilyType, FamilyStatus } from '../../entities/family.entity';
import { Member, Gender, Status } from '../../entities/member.entity';
import { Hubret } from '../../entities/hubret.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';

export interface CreateFamilyDto {
  familyId: string;
  familyNameAmharic: string;
  familyNameEnglish: string;
  familyType?: FamilyType;
  hubretId?: string;
  headMemberId?: string;
  contactMemberId?: string;
  organizerCoordinatorMemberId?: string;
  financeMemberId?: string;
  politicalSectorMemberId?: string;
  notes?: string;
}

export interface UpdateFamilyDto {
  familyNameAmharic?: string;
  familyNameEnglish?: string;
  familyType?: FamilyType;
  status?: FamilyStatus;
  hubretId?: string;
  headMemberId?: string;
  contactMemberId?: string;
  organizerCoordinatorMemberId?: string;
  financeMemberId?: string;
  politicalSectorMemberId?: string;
  notes?: string;
}

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Hubret)
    private hubretRepository: Repository<Hubret>,
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

    // Validate hubret if provided
    let hubret: Hubret | undefined;
    if (createFamilyDto.hubretId) {
      hubret = await this.hubretRepository.findOne({
        where: { id: createFamilyDto.hubretId },
      }) || undefined;
      if (!hubret) {
        throw new BadRequestException('Invalid hubret ID');
      }
    }

    const familyData: any = {
      ...createFamilyDto,
      familyType: createFamilyDto.familyType || FamilyType.NUCLEAR,
      status: FamilyStatus.ACTIVE,
      totalMembers: 0,
      activeMembers: 0,
      createdBy: userId,
      updatedBy: userId,
    };

    if (hubret) {
      familyData.hubret = hubret;
    }

    const family = this.familyRepository.create(familyData);

    const savedFamily: Family = await this.familyRepository.save(family) as any;

    // Log the creation
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.CREATE,
      entity: AuditEntity.FAMILY,
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
    status?: FamilyStatus,
    hubretId?: string
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

    if (hubretId !== undefined) {
      if (hubretId === 'null') {
        // Find families with no hubret assigned
        queryBuilder.andWhere('family.hubretId IS NULL');
      } else {
        // Find families assigned to specific hubret
        queryBuilder.andWhere('family.hubretId = :hubretId', { hubretId });
      }
    }

    queryBuilder
      .orderBy('family.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [families, total] = await queryBuilder.getManyAndCount();

    // Compute totalMembers and activeMembers from actual members (by member.status) so the list is always correct
    if (families.length > 0) {
      const familyIds = families.map((f) => f.id);
      const counts = await this.memberRepository
        .createQueryBuilder('member')
        .select('member.familyId', 'familyId')
        .addSelect('COUNT(*)', 'total')
        .addSelect(`SUM(CASE WHEN member.status = :active THEN 1 ELSE 0 END)`, 'active')
        .where('member.familyId IN (:...familyIds)', { familyIds, active: Status.ACTIVE })
        .groupBy('member.familyId')
        .getRawMany<{ familyId: string; total: string; active: string }>();

      const countByFamilyId = new Map(counts.map((c) => [c.familyId, { total: parseInt(c.total || '0', 10), active: parseInt(c.active || '0', 10) }]));
      families.forEach((f) => {
        const c = countByFamilyId.get(f.id);
        (f as any).totalMembers = c ? c.total : 0;
        (f as any).activeMembers = c ? c.active : 0;
      });
    }

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
      relations: ['members', 'head', 'organizerCoordinator', 'finance', 'politicalSector'],
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Override totalMembers and activeMembers from actual members (by member.status)
    const totalMembers = family.members?.length ?? 0;
    const activeMembers = family.members?.filter((m) => m.status === Status.ACTIVE).length ?? 0;
    (family as any).totalMembers = totalMembers;
    (family as any).activeMembers = activeMembers;

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
      hubretId: family.hubretId,
    };

    // Validate hubret if provided
    if (updateFamilyDto.hubretId !== undefined) {
      if (updateFamilyDto.hubretId) {
        const hubret = await this.hubretRepository.findOne({
          where: { id: updateFamilyDto.hubretId },
        });
        if (!hubret) {
          throw new BadRequestException('Invalid hubret ID');
        }
        family.hubret = hubret;
      } else {
        family.hubret = undefined;
      }
    }

    // Convert empty-string UUIDs to null so PostgreSQL accepts them
    const uuidFields = ['headMemberId', 'contactMemberId', 'organizerCoordinatorMemberId', 'financeMemberId', 'politicalSectorMemberId'];
    const sanitizedDto = { ...updateFamilyDto };
    uuidFields.forEach((field) => {
      if (sanitizedDto[field] === '') {
        sanitizedDto[field] = null;
      }
    });

    // Update family
    Object.assign(family, sanitizedDto);
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

    const activeMembers = allMembers.filter(m => m.status === Status.ACTIVE);
    const activeMaleMembers = activeMembers.filter(m => m.gender === Gender.MALE).length;
    const activeFemaleMembers = activeMembers.filter(m => m.gender === Gender.FEMALE).length;

    const inactiveMembers = allMembers.filter(m => m.status !== Status.ACTIVE);
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
      member.status === Status.ACTIVE
    ).length || 0;

    await this.familyRepository.update(familyId, {
      totalMembers,
      activeMembers,
    });
  }

  /** Recompute totalMembers and activeMembers (by member.status) for all families. */
  async recomputeAllFamilyMemberCounts(): Promise<{ updated: number }> {
    const families = await this.familyRepository.find({ select: ['id'] });
    for (const f of families) {
      await this.updateMemberCount(f.id);
    }
    return { updated: families.length };
  }
}
