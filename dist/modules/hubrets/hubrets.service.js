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
exports.HubretsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hubret_entity_1 = require("../../entities/hubret.entity");
const family_entity_1 = require("../../entities/family.entity");
const audit_log_service_1 = require("../audit/audit-log.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let HubretsService = class HubretsService {
    hubretRepository;
    familyRepository;
    auditLogService;
    constructor(hubretRepository, familyRepository, auditLogService) {
        this.hubretRepository = hubretRepository;
        this.familyRepository = familyRepository;
        this.auditLogService = auditLogService;
    }
    async create(createHubretDto, userId) {
        const count = await this.hubretRepository.count();
        const hubretId = `HUB-${String(count + 1).padStart(4, '0')}`;
        const existingHubret = await this.hubretRepository.findOne({
            where: [
                { hubretNameAmharic: createHubretDto.hubretNameAmharic },
                { hubretNameEnglish: createHubretDto.hubretNameEnglish },
            ],
        });
        if (existingHubret) {
            throw new common_1.ConflictException('Hubret name already exists');
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
        await this.auditLogService.logAction({
            userId,
            username: 'system',
            action: audit_log_entity_1.AuditAction.CREATE,
            entity: audit_log_entity_1.AuditEntity.HUBRET,
            entityId: savedHubret.id,
            newValues: { hubretNameAmharic: savedHubret.hubretNameAmharic, hubretNameEnglish: savedHubret.hubretNameEnglish },
            notes: 'Hubret created',
        });
        return savedHubret;
    }
    async findAll() {
        return this.hubretRepository.find({
            relations: ['families'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const hubret = await this.hubretRepository.findOne({
            where: { id },
            relations: [
                'families',
                'families.members',
                'leader',
                'deputyPoliticalSectorHead',
                'deputyOrganizationSectorHead',
                'deputyFinanceSectorHead',
            ],
        });
        if (!hubret) {
            throw new common_1.NotFoundException('Hubret not found');
        }
        return hubret;
    }
    async update(id, updateHubretDto, userId) {
        const hubret = await this.findOne(id);
        if (updateHubretDto.hubretNameAmharic || updateHubretDto.hubretNameEnglish) {
            const existingHubret = await this.hubretRepository.findOne({
                where: [
                    updateHubretDto.hubretNameAmharic ? { hubretNameAmharic: updateHubretDto.hubretNameAmharic } : {},
                    updateHubretDto.hubretNameEnglish ? { hubretNameEnglish: updateHubretDto.hubretNameEnglish } : {},
                ].filter(obj => Object.keys(obj).length > 0),
            });
            if (existingHubret && existingHubret.id !== id) {
                throw new common_1.ConflictException('Hubret name already exists');
            }
        }
        const uuidFields = ['leaderMemberId', 'deputyPoliticalSectorHeadMemberId', 'deputyOrganizationSectorHeadMemberId', 'deputyFinanceSectorHeadMemberId'];
        const sanitizedDto = { ...updateHubretDto };
        uuidFields.forEach((field) => {
            if (sanitizedDto[field] === '') {
                sanitizedDto[field] = null;
            }
        });
        Object.assign(hubret, sanitizedDto);
        hubret.updatedBy = userId;
        const savedHubret = await this.hubretRepository.save(hubret);
        await this.auditLogService.logAction({
            userId,
            username: 'system',
            action: audit_log_entity_1.AuditAction.UPDATE,
            entity: audit_log_entity_1.AuditEntity.HUBRET,
            entityId: savedHubret.id,
            oldValues: {},
            newValues: updateHubretDto,
            notes: 'Hubret updated',
        });
        return savedHubret;
    }
    async remove(id, userId) {
        const hubret = await this.findOne(id);
        if (hubret.families && hubret.families.length > 0) {
            throw new common_1.BadRequestException('Cannot delete hubret with associated families');
        }
        await this.hubretRepository.remove(hubret);
        await this.auditLogService.logAction({
            userId,
            username: 'system',
            action: audit_log_entity_1.AuditAction.DELETE,
            entity: audit_log_entity_1.AuditEntity.HUBRET,
            entityId: id,
            oldValues: { hubretNameAmharic: hubret.hubretNameAmharic, hubretNameEnglish: hubret.hubretNameEnglish },
            notes: 'Hubret deleted',
        });
    }
    async getStats() {
        const hubrets = await this.hubretRepository.find({
            relations: ['families', 'families.members'],
        });
        const totalHubrets = hubrets.length;
        const activeHubrets = hubrets.filter(h => h.status === hubret_entity_1.HubretStatus.ACTIVE).length;
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
    async checkFamilyAssignment(familyId, targetHubretId) {
        const family = await this.familyRepository.findOne({
            where: { id: familyId },
            relations: ['hubret'],
        });
        if (!family) {
            return { canAssign: false, message: 'Family not found' };
        }
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
    async assignFamilyToHubret(familyId, hubretId, userId) {
        const family = await this.familyRepository.findOne({
            where: { id: familyId },
            relations: ['hubret'],
        });
        if (!family) {
            throw new common_1.NotFoundException('Family not found');
        }
        const oldHubretId = family.hubretId;
        if (hubretId) {
            const hubret = await this.hubretRepository.findOne({
                where: { id: hubretId },
            });
            if (!hubret) {
                throw new common_1.NotFoundException('Hubret not found');
            }
            family.hubret = hubret;
            family.hubretId = hubretId;
        }
        else {
            family.hubret = undefined;
            family.hubretId = undefined;
        }
        family.updatedBy = userId;
        const savedFamily = await this.familyRepository.save(family);
        if (oldHubretId && oldHubretId !== hubretId) {
            await this.updateHubretStats(oldHubretId);
        }
        await this.updateHubretStats(hubretId);
        return savedFamily;
    }
    async updateHubretStats(hubretId) {
        if (!hubretId)
            return;
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
                        activeMembers += family.members.filter(m => m.status === 'active').length;
                    }
                });
            }
            hubret.totalMembers = totalMembers;
            hubret.activeMembers = activeMembers;
            await this.hubretRepository.save(hubret);
        }
    }
};
exports.HubretsService = HubretsService;
exports.HubretsService = HubretsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hubret_entity_1.Hubret)),
    __param(1, (0, typeorm_1.InjectRepository)(family_entity_1.Family)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_log_service_1.AuditLogService])
], HubretsService);
//# sourceMappingURL=hubrets.service.js.map