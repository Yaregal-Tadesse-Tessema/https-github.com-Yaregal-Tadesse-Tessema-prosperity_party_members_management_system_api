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
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const member_entity_1 = require("../../entities/member.entity");
const employment_info_entity_1 = require("../../entities/employment-info.entity");
const audit_log_service_1 = require("../audit/audit-log.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const families_service_1 = require("../families/families.service");
let MembersService = class MembersService {
    memberRepository;
    employmentRepository;
    auditLogService;
    familiesService;
    constructor(memberRepository, employmentRepository, auditLogService, familiesService) {
        this.memberRepository = memberRepository;
        this.employmentRepository = employmentRepository;
        this.auditLogService = auditLogService;
        this.familiesService = familiesService;
    }
    async create(createMemberDto, userId, username) {
        const existingMember = await this.memberRepository.findOne({
            where: { partyId: createMemberDto.partyId },
        });
        if (existingMember) {
            throw new common_1.ConflictException('Party ID already exists');
        }
        const today = new Date();
        const birthDate = new Date(createMemberDto.dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
            throw new common_1.BadRequestException('Member must be at least 18 years old');
        }
        if (createMemberDto.familyId) {
            try {
                await this.familiesService.findOne(createMemberDto.familyId);
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid family ID provided');
            }
        }
        const member = this.memberRepository.create({
            ...createMemberDto,
            membershipStatus: member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER,
            createdBy: userId,
            updatedBy: userId,
        });
        const savedMember = await this.memberRepository.save(member);
        if (createMemberDto.familyId) {
            await this.familiesService.updateMemberCount(createMemberDto.familyId);
        }
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.CREATE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: savedMember.id,
            newValues: {
                partyId: savedMember.partyId,
                fullNameEnglish: savedMember.fullNameEnglish,
                familyId: savedMember.familyId
            },
            notes: 'Member registration',
        });
        return savedMember;
    }
    async findAll(page = 1, limit = 10, search, membershipStatus, status, gender, subCity, familyId) {
        const query = this.memberRepository.createQueryBuilder('member')
            .leftJoinAndSelect('member.employmentHistory', 'employment')
            .leftJoinAndSelect('member.positionHistory', 'positions')
            .leftJoinAndSelect('member.contributions', 'contributions');
        if (search) {
            query.andWhere('(member.fullNameEnglish ILIKE :search OR member.fullNameAmharic ILIKE :search OR member.partyId ILIKE :search)', { search: `%${search}%` });
        }
        if (membershipStatus) {
            const normalizedMembershipStatus = typeof membershipStatus === 'string' ? membershipStatus.toLowerCase().trim() : membershipStatus;
            query.andWhere('member.membershipStatus = :membershipStatus', { membershipStatus: normalizedMembershipStatus });
            console.log('Filtering by membershipStatus:', normalizedMembershipStatus);
        }
        if (status) {
            const normalizedStatus = typeof status === 'string' ? status.toLowerCase().trim() : status;
            query.andWhere('member.status = :status', { status: normalizedStatus });
            console.log('Filtering by status:', normalizedStatus);
        }
        if (gender) {
            const normalizedGender = typeof gender === 'string' ? gender.toLowerCase().trim() : gender;
            query.andWhere('member.gender = :gender', { gender: normalizedGender });
            console.log('Filtering by gender:', normalizedGender, 'Type:', typeof gender, 'Original:', gender);
        }
        if (subCity) {
            query.andWhere('member.subCity = :subCity', { subCity });
        }
        if (familyId) {
            query.andWhere('member.familyId = :familyId', { familyId });
        }
        query.orderBy('member.createdAt', 'DESC');
        const sql = query.getQuery();
        const params = query.getParameters();
        console.log('Members query - SQL:', sql);
        console.log('Members query - Parameters:', JSON.stringify(params));
        console.log('Members query - Gender filter:', gender);
        const [members, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        console.log('Members query - Results:', {
            membersCount: members.length,
            total,
            genderFilter: gender,
            sampleGenders: members.slice(0, 3).map(m => m.gender)
        });
        return { members, total, page, limit };
    }
    async findOne(id) {
        const member = await this.memberRepository.findOne({
            where: { id },
            relations: [
                'employmentHistory',
                'positionHistory',
                'contributions',
                'attachments',
            ],
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        return member;
    }
    async update(id, updateMemberDto, userId, username) {
        const member = await this.findOne(id);
        const oldValues = {
            fullNameEnglish: member.fullNameEnglish,
            primaryPhone: member.primaryPhone,
            membershipStatus: member.membershipStatus,
            familyId: member.familyId,
        };
        const shouldClearFamilyId = updateMemberDto.familyId === '';
        if (shouldClearFamilyId) {
            delete updateMemberDto.familyId;
        }
        if (updateMemberDto.familyId) {
            try {
                await this.familiesService.findOne(updateMemberDto.familyId);
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid family ID provided');
            }
        }
        Object.assign(member, updateMemberDto);
        if (shouldClearFamilyId) {
            member.familyId = null;
        }
        member.updatedBy = userId;
        const updatedMember = await this.memberRepository.save(member);
        const oldFamilyId = oldValues.familyId;
        const newFamilyId = updatedMember.familyId;
        if (oldFamilyId !== newFamilyId) {
            if (oldFamilyId) {
                await this.familiesService.updateMemberCount(oldFamilyId);
            }
            if (newFamilyId) {
                await this.familiesService.updateMemberCount(newFamilyId);
            }
        }
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.UPDATE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: id,
            oldValues,
            newValues: {
                fullNameEnglish: updatedMember.fullNameEnglish,
                primaryPhone: updatedMember.primaryPhone,
                membershipStatus: updatedMember.membershipStatus,
                familyId: updatedMember.familyId,
            },
            notes: 'Member profile update',
        });
        return updatedMember;
    }
    async createEmploymentInfo(memberId, employmentDto, userId, username) {
        const member = await this.findOne(memberId);
        const employmentInfo = this.employmentRepository.create({
            ...employmentDto,
            memberId: member.id,
        });
        const saved = await this.employmentRepository.save(employmentInfo);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.CREATE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: memberId,
            newValues: {
                employmentStatus: saved.employmentStatus,
                organizationName: saved.organizationName,
            },
            notes: 'Employment information added',
        });
        return saved;
    }
    async updateEmploymentInfo(memberId, employmentId, employmentDto, userId, username) {
        const member = await this.findOne(memberId);
        const employmentInfo = await this.employmentRepository.findOne({
            where: { id: employmentId, memberId: member.id },
        });
        if (!employmentInfo) {
            throw new common_1.NotFoundException('Employment record not found');
        }
        const oldValues = {
            employmentStatus: employmentInfo.employmentStatus,
            organizationName: employmentInfo.organizationName,
            monthlySalary: employmentInfo.monthlySalary,
        };
        Object.assign(employmentInfo, employmentDto);
        const updated = await this.employmentRepository.save(employmentInfo);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.UPDATE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: memberId,
            oldValues,
            newValues: {
                employmentStatus: updated.employmentStatus,
                organizationName: updated.organizationName,
                monthlySalary: updated.monthlySalary,
            },
            notes: 'Employment information update',
        });
        return updated;
    }
    async deleteEmploymentInfo(memberId, employmentId, userId, username) {
        const member = await this.findOne(memberId);
        const employmentInfo = await this.employmentRepository.findOne({
            where: { id: employmentId, memberId: member.id },
        });
        if (!employmentInfo) {
            throw new common_1.NotFoundException('Employment record not found');
        }
        await this.employmentRepository.remove(employmentInfo);
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.DELETE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: memberId,
            oldValues: {
                employmentStatus: employmentInfo.employmentStatus,
                organizationName: employmentInfo.organizationName,
            },
            notes: 'Employment information deleted',
        });
    }
    async getEmploymentHistory(memberId) {
        const member = await this.findOne(memberId);
        return member.employmentHistory || [];
    }
    async getMemberStats() {
        const stats = await this.memberRepository
            .createQueryBuilder('member')
            .select('member.membershipStatus', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('member.membershipStatus')
            .getRawMany();
        const allMembers = await this.memberRepository.find({
            select: ['gender'],
        });
        const memberMembers = await this.memberRepository.find({
            select: ['gender'],
            where: {
                membershipStatus: member_entity_1.MembershipStatus.MEMBER,
            }
        });
        const supportiveMembers = await this.memberRepository.find({
            select: ['gender'],
            where: {
                membershipStatus: member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER,
            }
        });
        const candidateMembers = await this.memberRepository.find({
            select: ['gender'],
            where: {
                membershipStatus: member_entity_1.MembershipStatus.CANDIDATE,
            }
        });
        const isMale = (gender) => {
            if (!gender)
                return false;
            const normalized = typeof gender === 'string' ? gender.toLowerCase() : String(gender).toLowerCase();
            return normalized === 'male' || normalized === member_entity_1.Gender.MALE;
        };
        const isFemale = (gender) => {
            if (!gender)
                return false;
            const normalized = typeof gender === 'string' ? gender.toLowerCase() : String(gender).toLowerCase();
            return normalized === 'female' || normalized === member_entity_1.Gender.FEMALE;
        };
        const totalMaleMembers = allMembers.filter(m => isMale(m.gender)).length;
        const totalFemaleMembers = allMembers.filter(m => isFemale(m.gender)).length;
        const memberMaleMembers = memberMembers.filter(m => isMale(m.gender)).length;
        const memberFemaleMembers = memberMembers.filter(m => isFemale(m.gender)).length;
        const supportiveMaleMembers = supportiveMembers.filter(m => isMale(m.gender)).length;
        const supportiveFemaleMembers = supportiveMembers.filter(m => isFemale(m.gender)).length;
        const candidateMaleMembers = candidateMembers.filter(m => isMale(m.gender)).length;
        const candidateFemaleMembers = candidateMembers.filter(m => isFemale(m.gender)).length;
        console.log('Gender counts - All members:', allMembers.length);
        console.log('Gender counts - Total Male:', totalMaleMembers, 'Total Female:', totalFemaleMembers);
        console.log('Gender counts - Member Male:', memberMaleMembers, 'Member Female:', memberFemaleMembers);
        console.log('Gender counts - Supportive Male:', supportiveMaleMembers, 'Supportive Female:', supportiveFemaleMembers);
        console.log('Gender counts - Candidate Male:', candidateMaleMembers, 'Candidate Female:', candidateFemaleMembers);
        const result = {
            totalMembers: 0,
            memberMembers: 0,
            supportiveMembers: 0,
            candidateMembers: 0,
            totalMaleMembers: 0,
            totalFemaleMembers: 0,
            memberMaleMembers: 0,
            memberFemaleMembers: 0,
            supportiveMaleMembers: 0,
            supportiveFemaleMembers: 0,
            candidateMaleMembers: 0,
            candidateFemaleMembers: 0,
        };
        stats.forEach(stat => {
            const count = parseInt(stat.count);
            result.totalMembers += count;
            switch (stat.status) {
                case member_entity_1.MembershipStatus.MEMBER:
                    result.memberMembers = count;
                    break;
                case member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER:
                    result.supportiveMembers = count;
                    break;
                case member_entity_1.MembershipStatus.CANDIDATE:
                    result.candidateMembers = count;
                    break;
            }
        });
        result.totalMaleMembers = totalMaleMembers;
        result.totalFemaleMembers = totalFemaleMembers;
        result.memberMaleMembers = memberMaleMembers;
        result.memberFemaleMembers = memberFemaleMembers;
        result.supportiveMaleMembers = supportiveMaleMembers;
        result.supportiveFemaleMembers = supportiveFemaleMembers;
        result.candidateMaleMembers = candidateMaleMembers;
        result.candidateFemaleMembers = candidateFemaleMembers;
        console.log('Final result:', JSON.stringify(result, null, 2));
        return result;
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(1, (0, typeorm_1.InjectRepository)(employment_info_entity_1.EmploymentInfo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_log_service_1.AuditLogService,
        families_service_1.FamiliesService])
], MembersService);
//# sourceMappingURL=members.service.js.map