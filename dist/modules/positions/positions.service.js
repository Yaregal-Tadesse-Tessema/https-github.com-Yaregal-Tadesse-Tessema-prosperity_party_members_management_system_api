"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const position_history_entity_1 = require("../../entities/position-history.entity");
const member_entity_1 = require("../../entities/member.entity");
const audit_log_service_1 = require("../audit/audit-log.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let PositionsService = class PositionsService {
    positionRepository;
    memberRepository;
    auditLogService;
    constructor(positionRepository, memberRepository, auditLogService) {
        this.positionRepository = positionRepository;
        this.memberRepository = memberRepository;
        this.auditLogService = auditLogService;
    }
    async create(createPositionDto, userId, username) {
        const member = await this.memberRepository.findOne({
            where: { id: createPositionDto.memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
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
            status: createPositionDto.status || (createPositionDto.endDate ? position_history_entity_1.PositionStatus.COMPLETED : position_history_entity_1.PositionStatus.ACTIVE),
            createdBy: userId,
        });
        const savedPosition = await this.positionRepository.save(position);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.CREATE,
            entity: audit_log_entity_1.AuditEntity.POSITION,
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
    async findAll(page = 1, limit = 10, search, level, status) {
        const query = this.positionRepository.createQueryBuilder('position')
            .leftJoinAndSelect('position.member', 'member')
            .orderBy('position.startDate', 'DESC');
        if (search) {
            query.andWhere('(member.fullNameEnglish ILIKE :search OR member.fullNameAmharic ILIKE :search OR position.positionTitle ILIKE :search)', { search: `%${search}%` });
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
    async findByMember(memberId) {
        return this.positionRepository.find({
            where: { memberId },
            relations: ['member'],
            order: { startDate: 'DESC' },
        });
    }
    async findOne(id) {
        const position = await this.positionRepository.findOne({
            where: { id },
            relations: ['member'],
        });
        if (!position) {
            throw new common_1.NotFoundException('Position not found');
        }
        return position;
    }
    async update(id, updatePositionDto, userId, username) {
        const position = await this.findOne(id);
        const oldValues = {
            positionTitle: position.positionTitle,
            positionLevel: position.positionLevel,
            status: position.status,
            startDate: position.startDate,
            endDate: position.endDate,
        };
        Object.assign(position, updatePositionDto);
        if (updatePositionDto.endDate) {
            position.status = position_history_entity_1.PositionStatus.COMPLETED;
        }
        else if (updatePositionDto.status !== position_history_entity_1.PositionStatus.REVOKED) {
            position.status = position_history_entity_1.PositionStatus.ACTIVE;
        }
        position.updatedBy = userId;
        const updatedPosition = await this.positionRepository.save(position);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.UPDATE,
            entity: audit_log_entity_1.AuditEntity.POSITION,
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
    async remove(id, userId, username) {
        const position = await this.findOne(id);
        await this.positionRepository.remove(position);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.DELETE,
            entity: audit_log_entity_1.AuditEntity.POSITION,
            entityId: id,
            oldValues: {
                memberId: position.memberId,
                positionTitle: position.positionTitle,
                positionLevel: position.positionLevel,
            },
            notes: 'Position history deleted',
        });
    }
    async getPositionStats() {
        const positions = await this.positionRepository.find();
        const stats = {
            totalPositions: positions.length,
            activePositions: 0,
            completedPositions: 0,
            revokedPositions: 0,
            positionsByLevel: {},
        };
        positions.forEach(position => {
            switch (position.status) {
                case position_history_entity_1.PositionStatus.ACTIVE:
                    stats.activePositions++;
                    break;
                case position_history_entity_1.PositionStatus.COMPLETED:
                    stats.completedPositions++;
                    break;
                case position_history_entity_1.PositionStatus.REVOKED:
                    stats.revokedPositions++;
                    break;
            }
            const level = position.positionLevel;
            stats.positionsByLevel[level] = (stats.positionsByLevel[level] || 0) + 1;
        });
        return stats;
    }
};
exports.PositionsService = PositionsService;
exports.PositionsService = PositionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(position_history_entity_1.PositionHistory)),
    __param(1, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_log_service_1.AuditLogService])
], PositionsService);
//# sourceMappingURL=positions.service.js.map