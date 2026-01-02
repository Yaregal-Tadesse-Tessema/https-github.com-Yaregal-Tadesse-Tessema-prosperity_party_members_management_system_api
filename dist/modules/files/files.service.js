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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const file_attachment_entity_1 = require("../../entities/file-attachment.entity");
const member_entity_1 = require("../../entities/member.entity");
const fs = require("fs");
const path = require("path");
let FilesService = class FilesService {
    fileAttachmentRepository;
    memberRepository;
    constructor(fileAttachmentRepository, memberRepository) {
        this.fileAttachmentRepository = fileAttachmentRepository;
        this.memberRepository = memberRepository;
    }
    async uploadProfilePhoto(memberId, file, uploadedBy) {
        const member = await this.memberRepository.findOne({ where: { id: memberId } });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new common_1.BadRequestException('Only image files are allowed');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size must not exceed 5MB');
        }
        const uploadDir = path.join(process.cwd(), 'uploads', 'profile-photos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileExtension = path.extname(file.originalname);
        const filename = `profile-${memberId}-${Date.now()}${fileExtension}`;
        const filePath = path.join(uploadDir, filename);
        await this.fileAttachmentRepository.update({
            memberId,
            fileType: file_attachment_entity_1.FileType.PROFILE_PHOTO,
            isActive: true,
        }, { isActive: false });
        fs.writeFileSync(filePath, file.buffer);
        const fileAttachment = this.fileAttachmentRepository.create({
            memberId,
            filename,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            filePath,
            fileSize: file.size,
            fileType: file_attachment_entity_1.FileType.PROFILE_PHOTO,
            uploadedBy,
        });
        return this.fileAttachmentRepository.save(fileAttachment);
    }
    async getProfilePhoto(memberId) {
        return this.fileAttachmentRepository.findOne({
            where: {
                memberId,
                fileType: file_attachment_entity_1.FileType.PROFILE_PHOTO,
                isActive: true,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async getFileAttachment(id) {
        const file = await this.fileAttachmentRepository.findOne({
            where: { id, isActive: true },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        return file;
    }
    async deleteProfilePhoto(memberId, userId) {
        const fileAttachment = await this.fileAttachmentRepository.findOne({
            where: {
                memberId,
                fileType: file_attachment_entity_1.FileType.PROFILE_PHOTO,
                isActive: true,
            },
            order: { createdAt: 'DESC' },
        });
        if (!fileAttachment) {
            throw new common_1.NotFoundException('Profile photo not found');
        }
        if (fs.existsSync(fileAttachment.filePath)) {
            fs.unlinkSync(fileAttachment.filePath);
        }
        await this.fileAttachmentRepository.update(fileAttachment.id, {
            isActive: false,
        });
    }
    async getMemberAttachments(memberId) {
        return this.fileAttachmentRepository.find({
            where: {
                memberId,
                isActive: true,
            },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(file_attachment_entity_1.FileAttachment)),
    __param(1, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FilesService);
//# sourceMappingURL=files.service.js.map