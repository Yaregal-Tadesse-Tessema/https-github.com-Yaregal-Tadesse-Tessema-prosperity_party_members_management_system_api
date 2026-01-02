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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAttachment = exports.FileType = void 0;
const typeorm_1 = require("typeorm");
const member_entity_1 = require("./member.entity");
var FileType;
(function (FileType) {
    FileType["PROFILE_PHOTO"] = "profile_photo";
    FileType["ID_DOCUMENT"] = "id_document";
    FileType["CERTIFICATE"] = "certificate";
    FileType["OTHER"] = "other";
})(FileType || (exports.FileType = FileType = {}));
let FileAttachment = class FileAttachment {
    id;
    memberId;
    member;
    filename;
    originalFilename;
    mimeType;
    filePath;
    fileSize;
    fileType;
    isActive;
    description;
    createdAt;
    updatedAt;
    uploadedBy;
};
exports.FileAttachment = FileAttachment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FileAttachment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FileAttachment.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, member => member.attachments),
    (0, typeorm_1.JoinColumn)({ name: 'memberId' }),
    __metadata("design:type", member_entity_1.Member)
], FileAttachment.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FileAttachment.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FileAttachment.prototype, "originalFilename", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FileAttachment.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FileAttachment.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], FileAttachment.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: FileType.OTHER,
    }),
    __metadata("design:type", String)
], FileAttachment.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], FileAttachment.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FileAttachment.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FileAttachment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], FileAttachment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], FileAttachment.prototype, "uploadedBy", void 0);
exports.FileAttachment = FileAttachment = __decorate([
    (0, typeorm_1.Entity)('file_attachments')
], FileAttachment);
//# sourceMappingURL=file-attachment.entity.js.map