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
exports.FamiliesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const family_entity_1 = require("../../entities/family.entity");
const member_entity_1 = require("../../entities/member.entity");
const hubret_entity_1 = require("../../entities/hubret.entity");
const audit_log_service_1 = require("../audit/audit-log.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let FamiliesService = class FamiliesService {
    familyRepository;
    memberRepository;
    hubretRepository;
    auditLogService;
    constructor(familyRepository, memberRepository, hubretRepository, auditLogService) {
        this.familyRepository = familyRepository;
        this.memberRepository = memberRepository;
        this.hubretRepository = hubretRepository;
        this.auditLogService = auditLogService;
    }
    async create(createFamilyDto, userId, username) {
        const existingFamily = await this.familyRepository.findOne({
            where: { familyId: createFamilyDto.familyId },
        });
        if (existingFamily) {
            throw new common_1.ConflictException('Family ID already exists');
        }
        let hubret;
        if (createFamilyDto.hubretId) {
            hubret = await this.hubretRepository.findOne({
                where: { id: createFamilyDto.hubretId },
            }) || undefined;
            if (!hubret) {
                throw new common_1.BadRequestException('Invalid hubret ID');
            }
        }
        const familyData = {
            ...createFamilyDto,
            familyType: createFamilyDto.familyType || family_entity_1.FamilyType.NUCLEAR,
            status: family_entity_1.FamilyStatus.ACTIVE,
            totalMembers: 0,
            activeMembers: 0,
            createdBy: userId,
            updatedBy: userId,
        };
        if (hubret) {
            familyData.hubret = hubret;
        }
        const family = this.familyRepository.create(familyData);
        const savedFamily = await this.familyRepository.save(family);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.CREATE,
            entity: audit_log_entity_1.AuditEntity.FAMILY,
            entityId: savedFamily.id,
            newValues: { familyId: savedFamily.familyId, familyNameEnglish: savedFamily.familyNameEnglish },
            notes: 'Family registration',
        });
        return savedFamily;
    }
    async findAll(page = 1, limit = 10, search, status, hubretId) {
        const queryBuilder = this.familyRepository.createQueryBuilder('family');
        if (search) {
            queryBuilder.where('(family.familyNameAmharic LIKE :search OR family.familyNameEnglish LIKE :search OR family.familyId LIKE :search)', { search: `%${search}%` });
        }
        if (status) {
            queryBuilder.andWhere('family.status = :status', { status });
        }
        if (hubretId !== undefined) {
            if (hubretId === 'null') {
                queryBuilder.andWhere('family.hubretId IS NULL');
            }
            else {
                queryBuilder.andWhere('family.hubretId = :hubretId', { hubretId });
            }
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
    async findOne(id) {
        const family = await this.familyRepository.findOne({
            where: { id },
            relations: ['members', 'organizerCoordinator', 'finance', 'politicalSector'],
        });
        if (!family) {
            throw new common_1.NotFoundException('Family not found');
        }
        return family;
    }
    async findByFamilyId(familyId) {
        const family = await this.familyRepository.findOne({
            where: { familyId },
            relations: ['members'],
        });
        if (!family) {
            throw new common_1.NotFoundException('Family not found');
        }
        return family;
    }
    async update(id, updateFamilyDto, userId, username) {
        const family = await this.findOne(id);
        const oldValues = {
            familyNameEnglish: family.familyNameEnglish,
            familyType: family.familyType,
            status: family.status,
            hubretId: family.hubretId,
        };
        if (updateFamilyDto.hubretId !== undefined) {
            if (updateFamilyDto.hubretId) {
                const hubret = await this.hubretRepository.findOne({
                    where: { id: updateFamilyDto.hubretId },
                });
                if (!hubret) {
                    throw new common_1.BadRequestException('Invalid hubret ID');
                }
                family.hubret = hubret;
            }
            else {
                family.hubret = undefined;
            }
        }
        const uuidFields = ['headMemberId', 'contactMemberId', 'organizerCoordinatorMemberId', 'financeMemberId', 'politicalSectorMemberId'];
        const sanitizedDto = { ...updateFamilyDto };
        uuidFields.forEach((field) => {
            if (sanitizedDto[field] === '') {
                sanitizedDto[field] = null;
            }
        });
        Object.assign(family, sanitizedDto);
        family.updatedBy = userId;
        const savedFamily = await this.familyRepository.save(family);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.UPDATE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: savedFamily.id,
            oldValues,
            newValues: updateFamilyDto,
            notes: 'Family update',
        });
        return savedFamily;
    }
    async remove(id, userId, username) {
        const family = await this.findOne(id);
        if (family.members && family.members.length > 0) {
            throw new common_1.BadRequestException('Cannot delete family with active members. Please remove all members first.');
        }
        await this.familyRepository.remove(family);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.DELETE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: id,
            oldValues: { familyId: family.familyId, familyNameEnglish: family.familyNameEnglish },
            notes: 'Family deletion',
        });
    }
    async getStats() {
        const [totalFamilies, activeFamilies, nuclearFamilies, extendedFamilies] = await Promise.all([
            this.familyRepository.count(),
            this.familyRepository.count({ where: { status: family_entity_1.FamilyStatus.ACTIVE } }),
            this.familyRepository.count({ where: { familyType: family_entity_1.FamilyType.NUCLEAR } }),
            this.familyRepository.count({ where: { familyType: family_entity_1.FamilyType.EXTENDED } }),
        ]);
        const allMembers = await this.memberRepository
            .createQueryBuilder('member')
            .where('member.familyId IS NOT NULL')
            .getMany();
        const totalMaleMembers = allMembers.filter(m => m.gender === member_entity_1.Gender.MALE).length;
        const totalFemaleMembers = allMembers.filter(m => m.gender === member_entity_1.Gender.FEMALE).length;
        const activeMembers = allMembers.filter(m => m.membershipStatus === member_entity_1.MembershipStatus.MEMBER);
        const activeMaleMembers = activeMembers.filter(m => m.gender === member_entity_1.Gender.MALE).length;
        const activeFemaleMembers = activeMembers.filter(m => m.gender === member_entity_1.Gender.FEMALE).length;
        const inactiveMembers = allMembers.filter(m => m.membershipStatus === member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER);
        const inactiveMaleMembers = inactiveMembers.filter(m => m.gender === member_entity_1.Gender.MALE).length;
        const inactiveFemaleMembers = inactiveMembers.filter(m => m.gender === member_entity_1.Gender.FEMALE).length;
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
    async updateMemberCount(familyId) {
        const family = await this.familyRepository.findOne({
            where: { id: familyId },
            relations: ['members'],
        });
        if (!family)
            return;
        const totalMembers = family.members?.length || 0;
        const activeMembers = family.members?.filter(member => member.membershipStatus === member_entity_1.MembershipStatus.MEMBER).length || 0;
        await this.familyRepository.update(familyId, {
            totalMembers,
            activeMembers,
        });
    }
};
exports.FamiliesService = FamiliesService;
exports.FamiliesService = FamiliesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(family_entity_1.Family)),
    __param(1, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(2, (0, typeorm_1.InjectRepository)(hubret_entity_1.Hubret)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_log_service_1.AuditLogService])
], FamiliesService);
//# sourceMappingURL=families.service.js.map