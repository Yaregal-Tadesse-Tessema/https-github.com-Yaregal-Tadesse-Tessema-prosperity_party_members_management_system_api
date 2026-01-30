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
const file_attachment_entity_1 = require("../../entities/file-attachment.entity");
const contribution_entity_1 = require("../../entities/contribution.entity");
const position_history_entity_1 = require("../../entities/position-history.entity");
const audit_log_service_1 = require("../audit/audit-log.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
const families_service_1 = require("../families/families.service");
const client_s3_1 = require("@aws-sdk/client-s3");
let MembersService = class MembersService {
    memberRepository;
    employmentRepository;
    fileAttachmentRepository;
    contributionRepository;
    positionHistoryRepository;
    auditLogService;
    familiesService;
    s3Client;
    constructor(memberRepository, employmentRepository, fileAttachmentRepository, contributionRepository, positionHistoryRepository, auditLogService, familiesService) {
        this.memberRepository = memberRepository;
        this.employmentRepository = employmentRepository;
        this.fileAttachmentRepository = fileAttachmentRepository;
        this.contributionRepository = contributionRepository;
        this.positionHistoryRepository = positionHistoryRepository;
        this.auditLogService = auditLogService;
        this.familiesService = familiesService;
        this.s3Client = new client_s3_1.S3Client({
            region: 'us-east-1',
            endpoint: 'http://196.189.124.228:9000',
            credentials: {
                accessKeyId: 'AY1WUU308IX79DRABRGI',
                secretAccessKey: 'neZmzgNaQpigqGext6G+HG6HM3Le7nXv3vhBNpaq',
            },
            forcePathStyle: true,
        });
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
        const sanitizedDto = { ...createMemberDto };
        const requiredFields = ['partyId', 'fullNameAmharic', 'fullNameEnglish', 'gender', 'dateOfBirth', 'primaryPhone', 'subCity', 'woreda', 'kebele', 'registrationDate'];
        Object.keys(sanitizedDto).forEach(key => {
            const value = sanitizedDto[key];
            if (typeof value === 'string') {
                if (value.trim() === '') {
                    if (!requiredFields.includes(key)) {
                        sanitizedDto[key] = null;
                    }
                }
                else {
                    sanitizedDto[key] = value.trim();
                }
            }
        });
        if (sanitizedDto.familyId) {
            try {
                await this.familiesService.findOne(sanitizedDto.familyId);
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid family ID provided');
            }
        }
        const memberData = {
            ...sanitizedDto,
            membershipStatus: member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER,
            createdBy: userId,
            updatedBy: userId,
        };
        const member = this.memberRepository.create(memberData);
        const savedMemberResult = await this.memberRepository.save(member);
        const savedMember = Array.isArray(savedMemberResult) ? savedMemberResult[0] : savedMemberResult;
        if (sanitizedDto.familyId) {
            await this.familiesService.updateMemberCount(sanitizedDto.familyId);
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
            query.andWhere('(member.fullNameEnglish ILIKE :search OR member.fullNameAmharic ILIKE :search OR CAST(member.partyId AS TEXT) ILIKE :search)', { search: `%${search}%` });
        }
        if (membershipStatus) {
            const normalizedMembershipStatus = typeof membershipStatus === 'string' ? membershipStatus.toLowerCase().trim() : membershipStatus;
            query.andWhere('member.membershipStatus = :membershipStatus', { membershipStatus: normalizedMembershipStatus });
        }
        if (status) {
            const normalizedStatus = typeof status === 'string' ? status.toLowerCase().trim() : status;
            query.andWhere('member.status = :status', { status: normalizedStatus });
        }
        if (gender) {
            const normalizedGender = typeof gender === 'string' ? gender.toLowerCase().trim() : gender;
            query.andWhere('member.gender = :gender', { gender: normalizedGender });
        }
        if (subCity) {
            query.andWhere('member.subCity = :subCity', { subCity });
        }
        if (familyId) {
            query.andWhere('member.familyId = :familyId', { familyId });
        }
        query.orderBy('member.partyId', 'ASC');
        const [members, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
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
        if (updateMemberDto.partyId !== undefined && updateMemberDto.partyId !== member.partyId) {
            const existingMember = await this.memberRepository.findOne({
                where: { partyId: updateMemberDto.partyId },
            });
            if (existingMember) {
                throw new common_1.ConflictException('Party ID already exists');
            }
        }
        const oldValues = {
            fullNameEnglish: member.fullNameEnglish,
            primaryPhone: member.primaryPhone,
            membershipStatus: member.membershipStatus,
            familyId: member.familyId,
        };
        const sanitizedDto = { ...updateMemberDto };
        Object.keys(sanitizedDto).forEach(key => {
            const value = sanitizedDto[key];
            if (typeof value === 'string') {
                if (value.trim() === '') {
                    sanitizedDto[key] = null;
                }
                else {
                    sanitizedDto[key] = value.trim();
                }
            }
        });
        if (sanitizedDto.familyId) {
            try {
                await this.familiesService.findOne(sanitizedDto.familyId);
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid family ID provided');
            }
        }
        Object.assign(member, sanitizedDto);
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
    async uploadEducationalDocuments(memberId, file, userId, username) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (file.mimetype !== 'application/pdf') {
            throw new common_1.BadRequestException('Only PDF files are allowed for educational documents');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size must not exceed 10MB');
        }
        const bucketName = 'prosperityparty';
        if (member.educationalDocumentsFile) {
            try {
                const urlParts = member.educationalDocumentsFile.split('/');
                const existingFilename = urlParts[urlParts.length - 1];
                const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
                const s3Client = new S3Client({
                    region: 'us-east-1',
                    endpoint: 'http://196.189.124.228:9000',
                    credentials: {
                        accessKeyId: 'L458FO8B14A0S02NAM6J',
                        secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
                    },
                    forcePathStyle: true,
                });
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: `educational-documents/${existingFilename}`,
                });
                await s3Client.send(deleteCommand);
                console.log(`Deleted old educational document from MinIO: educational-documents/${existingFilename}`);
            }
            catch (error) {
                console.error('Error deleting old educational document from MinIO:', error);
            }
        }
        const timestamp = Date.now();
        const filename = `educational-${memberId}-${timestamp}.pdf`;
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
            region: 'us-east-1',
            endpoint: 'http://196.189.124.228:9000',
            credentials: {
                accessKeyId: 'L458FO8B14A0S02NAM6J',
                secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
            },
            forcePathStyle: true,
        });
        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `educational-documents/${filename}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });
        await s3Client.send(uploadCommand);
        const minioUrl = `http://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || '196.189.124.228:9000'}/${bucketName}/educational-documents/${filename}`;
        await this.memberRepository.update(memberId, {
            educationalDocumentsFile: minioUrl,
            updatedBy: userId,
        });
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.UPDATE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: memberId,
            notes: `Uploaded educational documents: ${file.originalname}`,
        });
        return {
            message: 'Educational documents uploaded successfully',
            filename: filename,
            originalFilename: file.originalname,
            fileSize: file.size,
        };
    }
    async uploadExperienceDocuments(memberId, file, userId, username) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('File type not allowed. Only PDF, DOC, DOCX, JPG, and PNG files are accepted.');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size must not exceed 10MB');
        }
        const bucketName = 'prosperityparty';
        if (member.experienceDocumentsFile) {
            try {
                const urlParts = member.experienceDocumentsFile.split('/');
                const existingFilename = urlParts[urlParts.length - 1];
                const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
                const s3Client = new S3Client({
                    region: 'us-east-1',
                    endpoint: 'http://196.189.124.228:9000',
                    credentials: {
                        accessKeyId: 'L458FO8B14A0S02NAM6J',
                        secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
                    },
                    forcePathStyle: true,
                });
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: `experience-documents/${existingFilename}`,
                });
                await s3Client.send(deleteCommand);
                console.log(`Deleted old experience document from MinIO: experience-documents/${existingFilename}`);
            }
            catch (error) {
                console.error('Error deleting old experience document from MinIO:', error);
            }
        }
        const timestamp = Date.now();
        const fileExtension = require('path').extname(file.originalname);
        const filename = `experience-${memberId}-${timestamp}${fileExtension}`;
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
            region: 'us-east-1',
            endpoint: 'http://196.189.124.228:9000',
            credentials: {
                accessKeyId: 'L458FO8B14A0S02NAM6J',
                secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
            },
            forcePathStyle: true,
        });
        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `experience-documents/${filename}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });
        await s3Client.send(uploadCommand);
        const minioUrl = `http://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || '196.189.124.228:9000'}/${bucketName}/experience-documents/${filename}`;
        await this.memberRepository.update(memberId, {
            experienceDocumentsFile: minioUrl,
            updatedBy: userId,
        });
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.UPDATE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: memberId,
            notes: `Uploaded experience documents: ${file.originalname}`,
        });
        return {
            message: 'Experience documents uploaded successfully',
            filename: filename,
            originalFilename: file.originalname,
            fileSize: file.size,
        };
    }
    async getEducationalDocuments(memberId) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member || !member.educationalDocumentsFile) {
            return null;
        }
        return {
            filePath: member.educationalDocumentsFile,
            mimeType: 'application/pdf',
            originalFilename: `educational-documents-${memberId}.pdf`,
        };
    }
    async downloadEducationalDocuments(memberId) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member || !member.educationalDocumentsFile) {
            return null;
        }
        const urlParts = member.educationalDocumentsFile.split('/');
        const filename = urlParts[urlParts.length - 1];
        const bucketName = 'prosperityparty';
        const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
            region: 'us-east-1',
            endpoint: 'http://196.189.124.228:9000',
            credentials: {
                accessKeyId: 'L458FO8B14A0S02NAM6J',
                secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
            },
            forcePathStyle: true,
        });
        try {
            const getCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: `educational-documents/${filename}`,
            });
            const response = await s3Client.send(getCommand);
            const chunks = [];
            if (response.Body) {
                const stream = response.Body;
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                return Buffer.concat(chunks);
            }
            return null;
        }
        catch (error) {
            console.error('Error downloading educational documents from MinIO:', error);
            return null;
        }
    }
    async getExperienceDocuments(memberId) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member || !member.experienceDocumentsFile) {
            return null;
        }
        const urlParts = member.experienceDocumentsFile.split('.');
        const fileExtension = urlParts[urlParts.length - 1].toLowerCase();
        let mimeType = 'application/octet-stream';
        switch (fileExtension) {
            case 'pdf':
                mimeType = 'application/pdf';
                break;
            case 'doc':
                mimeType = 'application/msword';
                break;
            case 'docx':
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case 'jpg':
            case 'jpeg':
                mimeType = 'image/jpeg';
                break;
            case 'png':
                mimeType = 'image/png';
                break;
        }
        return {
            filePath: member.experienceDocumentsFile,
            mimeType,
            originalFilename: `experience-documents-${memberId}.${fileExtension}`,
        };
    }
    async downloadExperienceDocuments(memberId) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member || !member.experienceDocumentsFile) {
            return null;
        }
        const urlParts = member.experienceDocumentsFile.split('/');
        const filename = urlParts[urlParts.length - 1];
        const bucketName = 'prosperityparty';
        const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
            region: 'us-east-1',
            endpoint: 'http://196.189.124.228:9000',
            credentials: {
                accessKeyId: 'L458FO8B14A0S02NAM6J',
                secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
            },
            forcePathStyle: true,
        });
        try {
            const getCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: `experience-documents/${filename}`,
            });
            const response = await s3Client.send(getCommand);
            const chunks = [];
            if (response.Body) {
                const stream = response.Body;
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                return Buffer.concat(chunks);
            }
            return null;
        }
        catch (error) {
            console.error('Error downloading experience documents from MinIO:', error);
            return null;
        }
    }
    async deleteEducationalDocuments(memberId, userId, username) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (member.educationalDocumentsFile) {
            const urlParts = member.educationalDocumentsFile.split('/');
            const filename = urlParts[urlParts.length - 1];
            try {
                const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
                const s3Client = new S3Client({
                    region: 'us-east-1',
                    endpoint: 'http://196.189.124.228:9000',
                    credentials: {
                        accessKeyId: 'L458FO8B14A0S02NAM6J',
                        secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
                    },
                    forcePathStyle: true,
                });
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: 'prosperityparty',
                    Key: `educational-documents/${filename}`,
                });
                await s3Client.send(deleteCommand);
            }
            catch (error) {
                console.error('Error deleting educational document from MinIO:', error);
            }
            await this.memberRepository.update(memberId, {
                educationalDocumentsFile: null,
                updatedBy: userId,
            });
            await this.auditLogService.logAction({
                userId,
                username,
                action: audit_log_entity_1.AuditAction.DELETE,
                entity: audit_log_entity_1.AuditEntity.MEMBER,
                entityId: memberId,
                notes: 'Deleted educational documents',
            });
        }
        return { message: 'Educational documents deleted successfully' };
    }
    async deleteExperienceDocuments(memberId, userId, username) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (member.experienceDocumentsFile) {
            const urlParts = member.experienceDocumentsFile.split('/');
            const filename = urlParts[urlParts.length - 1];
            try {
                const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
                const s3Client = new S3Client({
                    region: 'us-east-1',
                    endpoint: 'http://196.189.124.228:9000',
                    credentials: {
                        accessKeyId: 'L458FO8B14A0S02NAM6J',
                        secretAccessKey: 'rhkZ6HrrxSuNbWmaE8UYJaCWKLTUkyepO9pUIX34',
                    },
                    forcePathStyle: true,
                });
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: 'prosperityparty',
                    Key: `experience-documents/${filename}`,
                });
                await s3Client.send(deleteCommand);
            }
            catch (error) {
                console.error('Error deleting experience document from MinIO:', error);
            }
            await this.memberRepository.update(memberId, {
                experienceDocumentsFile: null,
                updatedBy: userId,
            });
            await this.auditLogService.logAction({
                userId,
                username,
                action: audit_log_entity_1.AuditAction.DELETE,
                entity: audit_log_entity_1.AuditEntity.MEMBER,
                entityId: memberId,
                notes: 'Deleted experience documents',
            });
        }
        return { message: 'Experience documents deleted successfully' };
    }
    async getFilteredMembers(filters) {
        const queryBuilder = this.memberRepository.createQueryBuilder('member')
            .leftJoinAndSelect('member.employmentHistory', 'employment')
            .leftJoinAndSelect('member.positionHistory', 'position');
        if (filters.membershipStatusFilter && filters.membershipStatusFilter !== '') {
            queryBuilder.andWhere('member.membershipStatus = :membershipStatus', {
                membershipStatus: filters.membershipStatusFilter
            });
        }
        if (filters.activityStatusFilter && filters.activityStatusFilter !== '') {
            queryBuilder.andWhere('member.status = :status', {
                status: filters.activityStatusFilter
            });
        }
        if (filters.genderFilter && filters.genderFilter !== '') {
            queryBuilder.andWhere('member.gender = :gender', {
                gender: filters.genderFilter
            });
        }
        if (filters.searchQuery && filters.searchQuery.trim() !== '') {
            queryBuilder.andWhere('(member.fullNameEnglish LIKE :search OR member.fullNameAmharic LIKE :search OR CAST(member.partyId AS TEXT) LIKE :search OR member.primaryPhone LIKE :search)', { search: `%${filters.searchQuery}%` });
        }
        queryBuilder.orderBy('member.createdAt', 'DESC');
        return await queryBuilder.getMany();
    }
    async generateMembersPDF(members) {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Members Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .header-info { margin-bottom: 20px; }
            .status-active { color: #059669; }
            .status-inactive { color: #dc2626; }
            .status-suspended { color: #d97706; }
          </style>
        </head>
        <body>
          <h1>Members Report</h1>
          <div class="header-info">
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total Members:</strong> ${members.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Party ID</th>
                <th>Full Name (English)</th>
                <th>Full Name (Amharic)</th>
                <th>Gender</th>
                <th>Membership Status</th>
                <th>Activity Status</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              ${members.map(member => `
                <tr>
                  <td>${member.partyId}</td>
                  <td>${member.fullNameEnglish}</td>
                  <td>${member.fullNameAmharic || ''}</td>
                  <td>${member.gender || ''}</td>
                  <td>${member.membershipStatus || ''}</td>
                  <td class="status-${member.status || ''}">${member.status || ''}</td>
                  <td>${member.primaryPhone || ''}</td>
                  <td>${member.email || ''}</td>
                  <td>${member.registrationDate ? new Date(member.registrationDate).toLocaleDateString() : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        await browser.close();
        return pdfBuffer;
    }
    async generateMembersExcel(members) {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Members Report');
        worksheet.mergeCells('A1:I1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Members Report';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        worksheet.getCell('A3').value = 'Report Date:';
        worksheet.getCell('B3').value = new Date().toLocaleDateString();
        worksheet.getCell('A4').value = 'Total Members:';
        worksheet.getCell('B4').value = members.length;
        const headers = [
            'Party ID',
            'Full Name (English)',
            'Full Name (Amharic)',
            'Gender',
            'Membership Status',
            'Activity Status',
            'Phone',
            'Email',
            'Registration Date'
        ];
        headers.forEach((header, index) => {
            const cell = worksheet.getCell(6, index + 1);
            cell.value = header;
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8FAFC' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        members.forEach((member, rowIndex) => {
            const row = 7 + rowIndex;
            worksheet.getCell(row, 1).value = member.partyId;
            worksheet.getCell(row, 2).value = member.fullNameEnglish;
            worksheet.getCell(row, 3).value = member.fullNameAmharic || '';
            worksheet.getCell(row, 4).value = member.gender || '';
            worksheet.getCell(row, 5).value = member.membershipStatus || '';
            worksheet.getCell(row, 6).value = member.status || '';
            worksheet.getCell(row, 7).value = member.primaryPhone || '';
            worksheet.getCell(row, 8).value = member.email || '';
            worksheet.getCell(row, 9).value = member.registrationDate
                ? new Date(member.registrationDate).toLocaleDateString()
                : '';
            for (let col = 1; col <= 9; col++) {
                const cell = worksheet.getCell(row, col);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        });
        worksheet.columns.forEach(column => {
            column.width = 15;
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
    async delete(id, userId, username) {
        const member = await this.findOne(id);
        const fileAttachments = await this.fileAttachmentRepository.find({
            where: { memberId: id },
        });
        const bucketName = 'prosperityparty';
        for (const attachment of fileAttachments) {
            try {
                let key = '';
                if (attachment.fileType === 'profile_photo') {
                    key = `${id}/profile/${attachment.filename}`;
                }
                else {
                    const urlMatch = attachment.filePath.match(new RegExp(`${bucketName}/(.+)`));
                    if (urlMatch && urlMatch[1]) {
                        key = urlMatch[1];
                    }
                    else {
                        if (attachment.filePath.includes('educational') || attachment.fileType === 'educational_documents') {
                            key = `educational-documents/${attachment.filename}`;
                        }
                        else if (attachment.filePath.includes('experience') || attachment.fileType === 'experience_documents') {
                            key = `experience-documents/${attachment.filename}`;
                        }
                        else {
                            key = `documents/${attachment.filename}`;
                        }
                    }
                }
                let deleted = false;
                const keysToTry = [key];
                if (attachment.fileType === 'profile_photo') {
                    keysToTry.push(`profile/${attachment.filename}`);
                }
                else if (attachment.filePath.includes('educational')) {
                    keysToTry.push(`educational-documents/${attachment.filename}`);
                }
                else if (attachment.filePath.includes('experience')) {
                    keysToTry.push(`experience-documents/${attachment.filename}`);
                }
                for (const tryKey of keysToTry) {
                    try {
                        const deleteCommand = new client_s3_1.DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: tryKey,
                        });
                        await this.s3Client.send(deleteCommand);
                        console.log(`Deleted file from MinIO: ${tryKey}`);
                        deleted = true;
                        break;
                    }
                    catch (deleteError) {
                        if (deleteError.$metadata?.httpStatusCode === 404) {
                            continue;
                        }
                        console.warn(`Failed to delete ${tryKey}:`, deleteError.message);
                    }
                }
                if (!deleted) {
                    console.warn(`Could not delete file for attachment ${attachment.id} with any of the tried paths`);
                }
            }
            catch (error) {
                console.error(`Error processing file attachment ${attachment.id}:`, error);
            }
        }
        if (fileAttachments.length > 0) {
            await this.fileAttachmentRepository.remove(fileAttachments);
            console.log(`Deleted ${fileAttachments.length} file attachment(s) from database`);
        }
        const contributions = await this.contributionRepository.find({
            where: { memberId: id },
        });
        if (contributions.length > 0) {
            await this.contributionRepository.remove(contributions);
            console.log(`Deleted ${contributions.length} contribution(s)`);
        }
        const positionHistory = await this.positionHistoryRepository.find({
            where: { memberId: id },
        });
        if (positionHistory.length > 0) {
            await this.positionHistoryRepository.remove(positionHistory);
            console.log(`Deleted ${positionHistory.length} position history record(s)`);
        }
        const employmentInfo = await this.employmentRepository.find({
            where: { memberId: id },
        });
        if (employmentInfo.length > 0) {
            await this.employmentRepository.remove(employmentInfo);
            console.log(`Deleted ${employmentInfo.length} employment record(s)`);
        }
        if (member.familyId) {
            await this.familiesService.updateMemberCount(member.familyId);
        }
        await this.auditLogService.logAction({
            userId,
            username,
            action: audit_log_entity_1.AuditAction.DELETE,
            entity: audit_log_entity_1.AuditEntity.MEMBER,
            entityId: member.id,
            oldValues: {
                partyId: member.partyId,
                fullNameEnglish: member.fullNameEnglish,
                familyId: member.familyId,
            },
            notes: 'Member deleted',
        });
        await this.memberRepository.remove(member);
        console.log(`Member ${id} deleted successfully`);
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(1, (0, typeorm_1.InjectRepository)(employment_info_entity_1.EmploymentInfo)),
    __param(2, (0, typeorm_1.InjectRepository)(file_attachment_entity_1.FileAttachment)),
    __param(3, (0, typeorm_1.InjectRepository)(contribution_entity_1.Contribution)),
    __param(4, (0, typeorm_1.InjectRepository)(position_history_entity_1.PositionHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_log_service_1.AuditLogService,
        families_service_1.FamiliesService])
], MembersService);
//# sourceMappingURL=members.service.js.map