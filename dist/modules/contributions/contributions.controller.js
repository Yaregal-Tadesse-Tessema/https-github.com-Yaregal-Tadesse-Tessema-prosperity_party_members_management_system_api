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
exports.ContributionsController = void 0;
const common_1 = require("@nestjs/common");
const contributions_service_1 = require("./contributions.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ContributionsController = class ContributionsController {
    contributionsService;
    constructor(contributionsService) {
        this.contributionsService = contributionsService;
    }
    async create(createContributionDto, req) {
        return this.contributionsService.create(createContributionDto, req.user.id, req.user.username);
    }
    async findAll(page = '1', limit = '10', search, status, year, month) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const yearNum = year ? parseInt(year) : undefined;
        const monthNum = month ? parseInt(month) : undefined;
        return this.contributionsService.findAll(pageNum, limitNum, search, status, yearNum, monthNum);
    }
    async getStats() {
        return this.contributionsService.getContributionStats();
    }
    async findByMember(memberId, paymentMonth, paymentYear) {
        return this.contributionsService.findByMember(memberId, paymentMonth, paymentYear);
    }
    async getMemberSummary(memberId) {
        return this.contributionsService.getMemberContributionSummary(memberId);
    }
    async findOne(id) {
        return this.contributionsService.findOne(id);
    }
    async update(id, updateContributionDto, req) {
        return this.contributionsService.update(id, updateContributionDto, req.user.id, req.user.username);
    }
    async remove(id, req) {
        await this.contributionsService.remove(id, req.user.id, req.user.username);
        return { message: 'Contribution deleted successfully' };
    }
    async generateContributions(generateDto, req) {
        return this.contributionsService.generateMonthlyContributions(generateDto.month, generateDto.year, req.user.id, req.user.username);
    }
    async downloadPDF(id, req, res) {
        const pdfBuffer = await this.contributionsService.generateContributionPDF(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="contribution-${id}.pdf"`);
        res.send(pdfBuffer);
    }
};
exports.ContributionsController = ContributionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('year')),
    __param(5, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('member/:memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)('paymentMonth')),
    __param(2, (0, common_1.Query)('paymentYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "findByMember", null);
__decorate([
    (0, common_1.Get)('member/:memberId/summary'),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "getMemberSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "generateContributions", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ContributionsController.prototype, "downloadPDF", null);
exports.ContributionsController = ContributionsController = __decorate([
    (0, common_1.Controller)('contributions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [contributions_service_1.ContributionsService])
], ContributionsController);
//# sourceMappingURL=contributions.controller.js.map