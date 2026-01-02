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
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const members_service_1 = require("./members.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let MembersController = class MembersController {
    membersService;
    constructor(membersService) {
        this.membersService = membersService;
    }
    async create(createMemberDto, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        return this.membersService.create(createMemberDto, req.user.id, req.user.username);
    }
    async findAll(req, page = '1', limit = '10', search, membershipStatus, status, gender, subCity, familyId) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const canViewSalary = this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer']);
        console.log('Members API called with filters:', { page: pageNum, limit: limitNum, search, membershipStatus, status, gender, subCity, familyId });
        const result = await this.membersService.findAll(pageNum, limitNum, search, membershipStatus, status, gender, subCity, familyId);
        console.log('Members API returned:', { count: result.members.length, total: result.total });
        if (!canViewSalary) {
            result.members = result.members.map(member => {
                if (member.employmentHistory) {
                    member.employmentHistory = member.employmentHistory.map(emp => {
                        const { monthlySalary, ...rest } = emp;
                        return rest;
                    });
                }
                return member;
            });
        }
        return result;
    }
    async getStats(req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer', 'read_only_viewer']);
        return this.membersService.getMemberStats();
    }
    async findOne(id, req) {
        const canViewSalary = this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer']);
        const member = await this.membersService.findOne(id);
        if (!canViewSalary && member.employmentHistory) {
            member.employmentHistory = member.employmentHistory.map(emp => {
                const { monthlySalary, ...rest } = emp;
                return rest;
            });
        }
        return member;
    }
    async update(id, updateMemberDto, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        return this.membersService.update(id, updateMemberDto, req.user.id, req.user.username);
    }
    async createEmployment(id, employmentDto, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        if (employmentDto.monthlySalary && !this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer'])) {
            throw new common_1.ForbiddenException('Insufficient permissions to set salary information');
        }
        return this.membersService.createEmploymentInfo(id, employmentDto, req.user.id, req.user.username);
    }
    async getEmploymentHistory(id, req) {
        const canViewSalary = this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer']);
        const history = await this.membersService.getEmploymentHistory(id);
        if (!canViewSalary) {
            return history.map(emp => {
                const { monthlySalary, ...rest } = emp;
                return rest;
            });
        }
        return history;
    }
    async updateEmployment(id, employmentId, employmentDto, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        if (employmentDto.monthlySalary && !this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer'])) {
            throw new common_1.ForbiddenException('Insufficient permissions to update salary information');
        }
        return this.membersService.updateEmploymentInfo(id, employmentId, employmentDto, req.user.id, req.user.username);
    }
    async updateEmploymentLegacy(id, employmentDto, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        if (employmentDto.monthlySalary && !this.hasRole(req.user, ['system_admin', 'party_admin', 'finance_officer', 'data_entry_officer'])) {
            throw new common_1.ForbiddenException('Insufficient permissions to update salary information');
        }
        const member = await this.membersService.findOne(id);
        if (member.employmentHistory && member.employmentHistory.length > 0) {
            return this.membersService.updateEmploymentInfo(id, member.employmentHistory[0].id, employmentDto, req.user.id, req.user.username);
        }
        else {
            return this.membersService.createEmploymentInfo(id, employmentDto, req.user.id, req.user.username);
        }
    }
    async deleteEmployment(id, employmentId, req) {
        this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
        await this.membersService.deleteEmploymentInfo(id, employmentId, req.user.id, req.user.username);
        return { message: 'Employment record deleted successfully' };
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
exports.MembersController = MembersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('membershipStatus')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('gender')),
    __param(7, (0, common_1.Query)('subCity')),
    __param(8, (0, common_1.Query)('familyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/employment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "createEmployment", null);
__decorate([
    (0, common_1.Get)(':id/employment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "getEmploymentHistory", null);
__decorate([
    (0, common_1.Put)(':id/employment/:employmentId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('employmentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "updateEmployment", null);
__decorate([
    (0, common_1.Put)(':id/employment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "updateEmploymentLegacy", null);
__decorate([
    (0, common_1.Delete)(':id/employment/:employmentId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('employmentId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "deleteEmployment", null);
exports.MembersController = MembersController = __decorate([
    (0, common_1.Controller)('members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [members_service_1.MembersService])
], MembersController);
//# sourceMappingURL=members.controller.js.map