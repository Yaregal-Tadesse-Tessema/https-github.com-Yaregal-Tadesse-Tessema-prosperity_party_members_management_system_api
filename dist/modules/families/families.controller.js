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
exports.FamiliesController = void 0;
const common_1 = require("@nestjs/common");
const families_service_1 = require("./families.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const user_entity_1 = require("../../entities/user.entity");
const ALLOWED_ROLES_CREATE_UPDATE = [user_entity_1.UserRole.SYSTEM_ADMIN, user_entity_1.UserRole.PARTY_ADMIN, user_entity_1.UserRole.DATA_ENTRY_OFFICER];
const ALLOWED_ROLES_DELETE = [user_entity_1.UserRole.SYSTEM_ADMIN, user_entity_1.UserRole.PARTY_ADMIN];
let FamiliesController = class FamiliesController {
    familiesService;
    constructor(familiesService) {
        this.familiesService = familiesService;
    }
    checkPermission(user, allowedRoles) {
        if (!allowedRoles.includes(user.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
    hasRole(user, roles) {
        return roles.includes(user.role);
    }
    async create(createFamilyDto, req) {
        this.checkPermission(req.user, ALLOWED_ROLES_CREATE_UPDATE);
        return this.familiesService.create(createFamilyDto, req.user.id, req.user.username);
    }
    async findAll(req, page = '1', limit = '10', search, status) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        return this.familiesService.findAll(pageNum, limitNum, search, status);
    }
    async getStats() {
        return this.familiesService.getStats();
    }
    async findOne(id) {
        return this.familiesService.findOne(id);
    }
    async findByFamilyId(familyId) {
        return this.familiesService.findByFamilyId(familyId);
    }
    async update(id, updateFamilyDto, req) {
        this.checkPermission(req.user, ALLOWED_ROLES_CREATE_UPDATE);
        return this.familiesService.update(id, updateFamilyDto, req.user.id, req.user.username);
    }
    async remove(id, req) {
        this.checkPermission(req.user, ALLOWED_ROLES_DELETE);
        return this.familiesService.remove(id, req.user.id, req.user.username);
    }
};
exports.FamiliesController = FamiliesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('by-family-id/:familyId'),
    __param(0, (0, common_1.Param)('familyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "findByFamilyId", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "remove", null);
exports.FamiliesController = FamiliesController = __decorate([
    (0, common_1.Controller)('families'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [families_service_1.FamiliesService])
], FamiliesController);
//# sourceMappingURL=families.controller.js.map