import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hubret, HubretStatus } from '../../entities/hubret.entity';
import { Family } from '../../entities/family.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';

export interface CreateHubretDto {
  hubretNameAmharic: string;
  hubretNameEnglish: string;
  leaderMemberId?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  region?: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  notes?: string;
}

export interface UpdateHubretDto {
  hubretNameAmharic?: string;
  hubretNameEnglish?: string;
  status?: HubretStatus;
  leaderMemberId?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  region?: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  notes?: string;
}

@Injectable()
export class HubretsService {
  constructor(
    @InjectRepository(Hubret)
    private hubretRepository: Repository<Hubret>,
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    private auditLogService: AuditLogService,
  ) {}

  async create(createHubretDto: CreateHubretDto, userId: string): Promise<Hubret> {
    // Generate unique hubret ID
    const count = await this.hubretRepository.count();
    const hubretId = `HUB-${String(count + 1).padStart(4, '0')}`;

    // Check if hubret name already exists
    const existingHubret = await this.hubretRepository.findOne({
      where: [
        { hubretNameAmharic: createHubretDto.hubretNameAmharic },
        { hubretNameEnglish: createHubretDto.hubretNameEnglish },
      ],
    });

    if (existingHubret) {
      throw new ConflictException('Hubret name already exists');
    }

    const hubret = this.hubretRepository.create({
      hubretId,
      ...createHubretDto,
      totalFamilies: 0,
      totalMembers: 0,
      activeMembers: 0,
      createdBy: userId,
    });

    const savedHubret = await this.hubretRepository.save(hubret);

    // Log the creation
    await this.auditLogService.logAction({
      userId,
      username: 'system', // Will be updated with actual username
      action: AuditAction.CREATE,
      entity: AuditEntity.HUBRET,
      entityId: savedHubret.id,
      newValues: { hubretNameAmharic: savedHubret.hubretNameAmharic, hubretNameEnglish: savedHubret.hubretNameEnglish },
      notes: 'Hubret created',
    });

    return savedHubret;
  }

  async findAll(): Promise<Hubret[]> {
    return this.hubretRepository.find({
      relations: ['families'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Hubret> {
    const hubret = await this.hubretRepository.findOne({
      where: { id },
      relations: ['families', 'families.members'],
    });

    if (!hubret) {
      throw new NotFoundException('Hubret not found');
    }

    return hubret;
  }

  async update(id: string, updateHubretDto: UpdateHubretDto, userId: string): Promise<Hubret> {
    const hubret = await this.findOne(id);

    // Check for name conflicts if names are being updated
    if (updateHubretDto.hubretNameAmharic || updateHubretDto.hubretNameEnglish) {
      const existingHubret = await this.hubretRepository.findOne({
        where: [
          updateHubretDto.hubretNameAmharic ? { hubretNameAmharic: updateHubretDto.hubretNameAmharic } : {},
          updateHubretDto.hubretNameEnglish ? { hubretNameEnglish: updateHubretDto.hubretNameEnglish } : {},
        ].filter(obj => Object.keys(obj).length > 0),
      });

      if (existingHubret && existingHubret.id !== id) {
        throw new ConflictException('Hubret name already exists');
      }
    }

    Object.assign(hubret, updateHubretDto);
    hubret.updatedBy = userId;

    const savedHubret = await this.hubretRepository.save(hubret);

    // Log the update
    await this.auditLogService.logAction({
      userId,
      username: 'system',
      action: AuditAction.UPDATE,
      entity: AuditEntity.HUBRET,
      entityId: savedHubret.id,
      oldValues: {},
      newValues: updateHubretDto,
      notes: 'Hubret updated',
    });

    return savedHubret;
  }

  async remove(id: string, userId: string): Promise<void> {
    const hubret = await this.findOne(id);

    // Check if hubret has families
    if (hubret.families && hubret.families.length > 0) {
      throw new BadRequestException('Cannot delete hubret with associated families');
    }

    await this.hubretRepository.remove(hubret);

    // Log the deletion
    await this.auditLogService.logAction({
      userId,
      username: 'system',
      action: AuditAction.DELETE,
      entity: AuditEntity.HUBRET,
      entityId: id,
      oldValues: { hubretNameAmharic: hubret.hubretNameAmharic, hubretNameEnglish: hubret.hubretNameEnglish },
      notes: 'Hubret deleted',
    });
  }

  async getStats(): Promise<{
    totalHubrets: number;
    activeHubrets: number;
    totalFamilies: number;
    totalMembers: number;
  }> {
    const hubrets = await this.hubretRepository.find({
      relations: ['families', 'families.members'],
    });

    const totalHubrets = hubrets.length;
    const activeHubrets = hubrets.filter(h => h.status === HubretStatus.ACTIVE).length;

    let totalFamilies = 0;
    let totalMembers = 0;

    hubrets.forEach(hubret => {
      if (hubret.families) {
        totalFamilies += hubret.families.length;
        hubret.families.forEach(family => {
          if (family.members) {
            totalMembers += family.members.length;
          }
        });
      }
    });

    return {
      totalHubrets,
      activeHubrets,
      totalFamilies,
      totalMembers,
    };
  }

  async checkFamilyAssignment(familyId: string, targetHubretId: string): Promise<{
    canAssign: boolean;
    currentHubret?: { id: string; name: string };
    message: string;
  }> {
    const family = await this.familyRepository.findOne({
      where: { id: familyId },
      relations: ['hubret'],
    });

    if (!family) {
      return { canAssign: false, message: 'Family not found' };
    }

    // Check if family is already assigned to a hubret
    if (family.hubretId && family.hubretId !== targetHubretId) {
      return {
        canAssign: true,
        currentHubret: {
          id: family.hubretId,
          name: family.hubret?.hubretNameEnglish || 'Unknown Hubret'
        },
        message: `This family is currently assigned to "${family.hubret?.hubretNameEnglish || 'Unknown Hubret'}". Assigning it to the new hubret will remove it from the current one.`
      };
    }

    return { canAssign: true, message: 'Family can be assigned to this hubret' };
  }

  async assignFamilyToHubret(familyId: string, hubretId: string | null, userId: string): Promise<Family> {
    const family = await this.familyRepository.findOne({
      where: { id: familyId },
      relations: ['hubret'],
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Store the old hubret ID for statistics update
    const oldHubretId = family.hubretId;

    if (hubretId) {
      const hubret = await this.hubretRepository.findOne({
        where: { id: hubretId },
      });

      if (!hubret) {
        throw new NotFoundException('Hubret not found');
      }

      family.hubret = hubret;
      family.hubretId = hubretId;
    } else {
      family.hubret = undefined;
      family.hubretId = undefined;
    }

    family.updatedBy = userId;
    const savedFamily = await this.familyRepository.save(family);

    // Update statistics for both old and new hubrets
    if (oldHubretId && oldHubretId !== hubretId) {
      await this.updateHubretStats(oldHubretId);
    }
    await this.updateHubretStats(hubretId);

    return savedFamily;
  }

  private async updateHubretStats(hubretId: string | null): Promise<void> {
    if (!hubretId) return;

    const hubret = await this.hubretRepository.findOne({
      where: { id: hubretId },
      relations: ['families', 'families.members'],
    });

    if (hubret) {
      let totalMembers = 0;
      let activeMembers = 0;

      if (hubret.families) {
        hubret.totalFamilies = hubret.families.length;

        hubret.families.forEach(family => {
          if (family.members) {
            totalMembers += family.members.length;
            // Count active members (assuming status is defined in member entity)
            activeMembers += family.members.filter(m => (m as any).status === 'active').length;
          }
        });
      }

      hubret.totalMembers = totalMembers;
      hubret.activeMembers = activeMembers;

      await this.hubretRepository.save(hubret);
    }
  }
}
