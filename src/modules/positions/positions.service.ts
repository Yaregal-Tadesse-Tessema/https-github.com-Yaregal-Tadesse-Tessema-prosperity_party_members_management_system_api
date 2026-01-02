import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionHistory, PositionLevel, PositionStatus } from '../../entities/position-history.entity';
import { Member } from '../../entities/member.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';

export interface CreatePositionDto {
  memberId: string;
  positionTitle: string;
  positionLevel: PositionLevel;
  startDate: Date;
  endDate?: Date;
  appointingAuthority?: string;
  status?: PositionStatus;
  responsibilities?: string;
  achievements?: string;
}

export interface UpdatePositionDto {
  positionTitle?: string;
  positionLevel?: PositionLevel;
  startDate?: Date;
  endDate?: Date;
  appointingAuthority?: string;
  status?: PositionStatus;
  responsibilities?: string;
  achievements?: string;
}

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(PositionHistory)
    private positionRepository: Repository<PositionHistory>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private auditLogService: AuditLogService,
  ) {}

  async create(createPositionDto: CreatePositionDto, userId: string, username: string): Promise<PositionHistory> {
    const member = await this.memberRepository.findOne({
      where: { id: createPositionDto.memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const position = this.positionRepository.create({
      memberId: createPositionDto.memberId,
      member,
      positionTitle: createPositionDto.positionTitle,
      positionLevel: createPositionDto.positionLevel,
      startDate: createPositionDto.startDate,
      endDate: createPositionDto.endDate,
      appointingAuthority: createPositionDto.appointingAuthority,
      responsibilities: createPositionDto.responsibilities,
      achievements: createPositionDto.achievements,
      status: createPositionDto.status || (createPositionDto.endDate ? PositionStatus.COMPLETED : PositionStatus.ACTIVE),
      createdBy: userId,
    });

    const savedPosition = await this.positionRepository.save(position);

    // Log the creation
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.CREATE,
      entity: AuditEntity.POSITION,
      entityId: savedPosition.id,
      newValues: {
        memberId: savedPosition.memberId,
        positionTitle: savedPosition.positionTitle,
        positionLevel: savedPosition.positionLevel,
      },
      notes: 'Position history created',
    });

    return savedPosition;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    level?: PositionLevel,
    status?: PositionStatus,
  ): Promise<{ positions: PositionHistory[]; total: number; page: number; limit: number }> {
    const query = this.positionRepository.createQueryBuilder('position')
      .leftJoinAndSelect('position.member', 'member')
      .orderBy('position.startDate', 'DESC');

    if (search) {
      query.andWhere(
        '(member.fullNameEnglish ILIKE :search OR member.fullNameAmharic ILIKE :search OR position.positionTitle ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (level) {
      query.andWhere('position.positionLevel = :level', { level });
    }

    if (status) {
      query.andWhere('position.status = :status', { status });
    }

    const [positions, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { positions, total, page, limit };
  }

  async findByMember(memberId: string): Promise<PositionHistory[]> {
    return this.positionRepository.find({
      where: { memberId },
      relations: ['member'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PositionHistory> {
    const position = await this.positionRepository.findOne({
      where: { id },
      relations: ['member'],
    });

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    return position;
  }

  async update(id: string, updatePositionDto: UpdatePositionDto, userId: string, username: string): Promise<PositionHistory> {
    const position = await this.findOne(id);

    // Get old values for audit log
    const oldValues = {
      positionTitle: position.positionTitle,
      positionLevel: position.positionLevel,
      status: position.status,
      startDate: position.startDate,
      endDate: position.endDate,
    };

    // Update position
    Object.assign(position, updatePositionDto);

    // Update status based on end date
    if (updatePositionDto.endDate) {
      position.status = PositionStatus.COMPLETED;
    } else if (updatePositionDto.status !== PositionStatus.REVOKED) {
      position.status = PositionStatus.ACTIVE;
    }

    position.updatedBy = userId;

    const updatedPosition = await this.positionRepository.save(position);

    // Log the update
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.UPDATE,
      entity: AuditEntity.POSITION,
      entityId: id,
      oldValues,
      newValues: {
        positionTitle: updatedPosition.positionTitle,
        positionLevel: updatedPosition.positionLevel,
        status: updatedPosition.status,
        startDate: updatedPosition.startDate,
        endDate: updatedPosition.endDate,
      },
      notes: 'Position history updated',
    });

    return updatedPosition;
  }

  async remove(id: string, userId: string, username: string): Promise<void> {
    const position = await this.findOne(id);

    await this.positionRepository.remove(position);

    // Log the deletion
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.DELETE,
      entity: AuditEntity.POSITION,
      entityId: id,
      oldValues: {
        memberId: position.memberId,
        positionTitle: position.positionTitle,
        positionLevel: position.positionLevel,
      },
      notes: 'Position history deleted',
    });
  }

  async getPositionStats(): Promise<{
    totalPositions: number;
    activePositions: number;
    completedPositions: number;
    revokedPositions: number;
    positionsByLevel: Record<string, number>;
  }> {
    const positions = await this.positionRepository.find();

    const stats = {
      totalPositions: positions.length,
      activePositions: 0,
      completedPositions: 0,
      revokedPositions: 0,
      positionsByLevel: {} as Record<string, number>,
    };

    positions.forEach(position => {
      switch (position.status) {
        case PositionStatus.ACTIVE:
          stats.activePositions++;
          break;
        case PositionStatus.COMPLETED:
          stats.completedPositions++;
          break;
        case PositionStatus.REVOKED:
          stats.revokedPositions++;
          break;
      }

      const level = position.positionLevel;
      stats.positionsByLevel[level] = (stats.positionsByLevel[level] || 0) + 1;
    });

    return stats;
  }
}
