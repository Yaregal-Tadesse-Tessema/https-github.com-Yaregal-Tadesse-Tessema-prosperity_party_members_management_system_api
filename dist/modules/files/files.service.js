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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const path = require("path");
let FilesService = class FilesService {
    fileAttachmentRepository;
    memberRepository;
    s3Client;
    constructor(fileAttachmentRepository, memberRepository) {
        this.fileAttachmentRepository = fileAttachmentRepository;
        this.memberRepository = memberRepository;
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
            credentials: {
                accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
                secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
            },
            forcePathStyle: true,
        });
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
        const fileExtension = path.extname(file.originalname);
        const filename = `profile-${memberId}-${Date.now()}${fileExtension}`;
        const bucketName = 'prosperityparty';
        const existingPhoto = await this.fileAttachmentRepository.findOne({
            where: {
                memberId,
                fileType: file_attachment_entity_1.FileType.PROFILE_PHOTO,
                isActive: true,
            },
        });
        if (existingPhoto) {
            try {
                const deleteCommand = new client_s3_1.DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: `profile/${existingPhoto.filename}`,
                });
                await this.s3Client.send(deleteCommand);
                console.log(`Deleted old profile photo from MinIO: profile/${existingPhoto.filename}`);
            }
            catch (error) {
                console.error('Error deleting old profile photo from MinIO:', error);
            }
            await this.fileAttachmentRepository.update(existingPhoto.id, { isActive: false });
        }
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: `profile/${filename}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });
        await this.s3Client.send(uploadCommand);
        const fileAttachment = this.fileAttachmentRepository.create({
            memberId,
            filename,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            filePath: `https://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost:9000'}/${bucketName}/profile/${filename}`,
            fileSize: file.size,
            fileType: file_attachment_entity_1.FileType.PROFILE_PHOTO,
            uploadedBy,
        });
        return this.fileAttachmentRepository.save(fileAttachment);
    }
    async getProfilePhoto(memberId) {
        const fileAttachment = await this.fileAttachmentRepository.findOne({
            where: {
                memberId,
                fileType: file_attachment_entity_1.FileType.PROFILE_PHOTO,
                isActive: true,
            },
            order: { createdAt: 'DESC' },
        });
        if (fileAttachment) {
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: 'prosperityparty',
                Key: `profile/${fileAttachment.filename}`,
            });
            try {
                const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, getCommand, { expiresIn: 3600 });
                fileAttachment.filePath = signedUrl;
            }
            catch (error) {
                console.error('Error generating signed URL:', error);
                fileAttachment.filePath = `https://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost:9000'}/prosperityparty/profile/${fileAttachment.filename}`;
            }
        }
        return fileAttachment;
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
    async downloadProfilePhoto(memberId) {
        const fileAttachment = await this.fileAttachmentRepository.findOne({
            where: {
                memberId,
                fileType: file_attachment_entity_1.FileType.PROFILE_PHOTO,
                isActive: true,
            },
            order: { createdAt: 'DESC' },
        });
        if (!fileAttachment) {
            return null;
        }
        try {
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: 'prosperityparty',
                Key: `profile/${fileAttachment.filename}`,
            });
            const response = await this.s3Client.send(getCommand);
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
            console.error('Error downloading profile photo from MinIO:', error);
            return null;
        }
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
        try {
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: 'prosperityparty',
                Key: `profile/${fileAttachment.filename}`,
            });
            await this.s3Client.send(deleteCommand);
        }
        catch (error) {
            console.error('Error deleting file from MinIO:', error);
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
    async uploadDocument(memberId, file, uploadedBy) {
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
        const fileExtension = path.extname(file.originalname);
        const timestamp = Date.now();
        const filename = `doc-${memberId}-${timestamp}${fileExtension}`;
        const bucketName = 'prosperityparty';
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: `documents/${filename}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });
        await this.s3Client.send(uploadCommand);
        let fileType = file_attachment_entity_1.FileType.OTHER;
        const originalFilename = file.originalname.toLowerCase();
        if (originalFilename.includes('education') || originalFilename.includes('certificate') || file.mimetype === 'application/pdf') {
            fileType = file_attachment_entity_1.FileType.EDUCATIONAL_DOCUMENTS;
        }
        else if (originalFilename.includes('experience') || originalFilename.includes('work')) {
            fileType = file_attachment_entity_1.FileType.EXPERIENCE_DOCUMENTS;
        }
        else if (originalFilename.includes('employment') || originalFilename.includes('letter') || originalFilename.includes('contract')) {
            fileType = file_attachment_entity_1.FileType.EMPLOYMENT_LETTER;
        }
        const fileAttachment = this.fileAttachmentRepository.create({
            memberId,
            filename,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            filePath: `https://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost:9000'}/${bucketName}/documents/${filename}`,
            fileSize: file.size,
            fileType,
            uploadedBy,
            description: `Document uploaded for member ${member.fullNameEnglish}`,
        });
        return this.fileAttachmentRepository.save(fileAttachment);
    }
    async deleteFile(id, userId) {
        const fileAttachment = await this.fileAttachmentRepository.findOne({
            where: { id, isActive: true },
        });
        if (!fileAttachment) {
            throw new common_1.NotFoundException('File not found');
        }
        try {
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: 'prosperityparty',
                Key: `documents/${fileAttachment.filename}`,
            });
            await this.s3Client.send(deleteCommand);
        }
        catch (error) {
            console.error('Error deleting file from MinIO:', error);
        }
        await this.fileAttachmentRepository.update(id, {
            isActive: false,
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