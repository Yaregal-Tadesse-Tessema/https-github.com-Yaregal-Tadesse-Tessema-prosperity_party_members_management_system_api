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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const files_service_1 = require("./files.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const fs = require("fs");
let FilesController = class FilesController {
    filesService;
    constructor(filesService) {
        this.filesService = filesService;
    }
    async uploadProfilePhoto(memberId, file, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        return this.filesService.uploadProfilePhoto(memberId, file, req.user.id);
    }
    async getProfilePhoto(memberId, res) {
        const fileAttachment = await this.filesService.getProfilePhoto(memberId);
        if (!fileAttachment) {
            return res.status(404).json({ message: 'Profile photo not found' });
        }
        const fileBuffer = await this.filesService.downloadProfilePhoto(memberId);
        if (!fileBuffer) {
            return res.status(404).json({ message: 'Profile photo not found in storage' });
        }
        res.setHeader('Content-Type', fileAttachment.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileAttachment.originalFilename}"`);
        res.send(fileBuffer);
    }
    async deleteProfilePhoto(memberId, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        await this.filesService.deleteProfilePhoto(memberId, req.user.id);
        return { message: 'Profile photo deleted successfully' };
    }
    async deleteFile(id, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        await this.filesService.deleteFile(id, req.user.id);
        return { message: 'File deleted successfully' };
    }
    async uploadDocument(memberId, file, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        return this.filesService.uploadDocument(memberId, file, req.user.id);
    }
    async getMemberAttachments(memberId) {
        return this.filesService.getMemberAttachments(memberId);
    }
    async downloadFile(id, res) {
        const fileAttachment = await this.filesService.getFileAttachment(id);
        if (!fs.existsSync(fileAttachment.filePath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }
        res.setHeader('Content-Type', fileAttachment.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileAttachment.originalFilename}"`);
        const fileStream = fs.createReadStream(fileAttachment.filePath);
        fileStream.pipe(res);
    }
    checkPermission(user, allowedRoles) {
        if (!this.hasRole(user, allowedRoles)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
    hasRole(user, roles) {
        return roles.includes(user.role);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('members/:memberId/profile-photo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadProfilePhoto", null);
__decorate([
    (0, common_1.Get)('members/:memberId/profile-photo'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getProfilePhoto", null);
__decorate([
    (0, common_1.Delete)('members/:memberId/profile-photo'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "deleteProfilePhoto", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Post)('members/:memberId/documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)('members/:memberId/attachments'),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getMemberAttachments", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "downloadFile", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map