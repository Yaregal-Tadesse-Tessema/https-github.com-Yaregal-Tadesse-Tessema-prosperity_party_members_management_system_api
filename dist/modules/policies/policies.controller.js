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
exports.PoliciesController = void 0;
const common_1 = require("@nestjs/common");
const policies_service_1 = require("./policies.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const ADMIN_ROLES = ['system_admin', 'party_admin', 'data_entry_officer'];
let PoliciesController = class PoliciesController {
    policiesService;
    constructor(policiesService) {
        this.policiesService = policiesService;
    }
    create(dto, req) {
        this.requireAdmin(req.user);
        return this.policiesService.create(dto, req.user.id);
    }
    findAll(page = '1', limit = '20', category) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        return this.policiesService.findAll(pageNum, limitNum, category);
    }
    findOne(id) {
        return this.policiesService.findOne(id);
    }
    update(id, dto, req) {
        this.requireAdmin(req.user);
        return this.policiesService.update(id, dto);
    }
    async remove(id, req) {
        this.requireAdmin(req.user);
        await this.policiesService.remove(id);
        return { message: 'Policy document deleted successfully' };
    }
    requireAdmin(user) {
        if (!user?.role || !ADMIN_ROLES.includes(user.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
};
exports.PoliciesController = PoliciesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "remove", null);
exports.PoliciesController = PoliciesController = __decorate([
    (0, common_1.Controller)('policies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [policies_service_1.PoliciesService])
], PoliciesController);
//# sourceMappingURL=policies.controller.js.map