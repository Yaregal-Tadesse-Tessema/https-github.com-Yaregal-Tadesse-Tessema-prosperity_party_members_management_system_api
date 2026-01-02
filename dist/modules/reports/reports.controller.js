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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getMemberByEducationReport() {
        return this.reportsService.getMemberByEducationReport();
    }
    async getMemberByGenderReport() {
        return this.reportsService.getMemberByGenderReport();
    }
    async getMemberByPositionReport() {
        return this.reportsService.getMemberByPositionReport();
    }
    async getOutstandingContributions() {
        return this.reportsService.getOutstandingContributions();
    }
    async getComprehensiveDashboard() {
        return this.reportsService.getComprehensiveDashboard();
    }
    async exportMemberReport(format = 'json', startDate, endDate, subCity, woreda, membershipStatus, gender) {
        const filters = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            subCity,
            woreda,
            membershipStatus: membershipStatus,
            gender: gender,
        };
        const report = await this.reportsService.getMemberReport(filters);
        return {
            format,
            data: report,
            generatedAt: new Date().toISOString(),
        };
    }
    async exportContributionReport(format = 'json', startDate, endDate, paymentStatus) {
        const filters = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            paymentStatus: paymentStatus,
        };
        const report = await this.reportsService.getContributionReport(filters);
        return {
            format,
            data: report,
            generatedAt: new Date().toISOString(),
        };
    }
    async getMemberReport(startDate, endDate, subCity, woreda, membershipStatus, gender) {
        const filters = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            subCity,
            woreda,
            membershipStatus: membershipStatus,
            gender: gender,
        };
        return this.reportsService.getMemberReport(filters);
    }
    async getPositionReport(startDate, endDate, positionLevel) {
        const filters = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            positionLevel: positionLevel,
        };
        return this.reportsService.getPositionReport(filters);
    }
    async getContributionReport(startDate, endDate, paymentStatus) {
        const filters = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            paymentStatus: paymentStatus,
        };
        return this.reportsService.getContributionReport(filters);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('members-by-education'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMemberByEducationReport", null);
__decorate([
    (0, common_1.Get)('members-by-gender'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMemberByGenderReport", null);
__decorate([
    (0, common_1.Get)('members-by-position'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMemberByPositionReport", null);
__decorate([
    (0, common_1.Get)('outstanding-contributions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getOutstandingContributions", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getComprehensiveDashboard", null);
__decorate([
    (0, common_1.Get)('export/members'),
    __param(0, (0, common_1.Query)('format')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('subCity')),
    __param(4, (0, common_1.Query)('woreda')),
    __param(5, (0, common_1.Query)('membershipStatus')),
    __param(6, (0, common_1.Query)('gender')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportMemberReport", null);
__decorate([
    (0, common_1.Get)('export/contributions'),
    __param(0, (0, common_1.Query)('format')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('paymentStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportContributionReport", null);
__decorate([
    (0, common_1.Get)('members'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('subCity')),
    __param(3, (0, common_1.Query)('woreda')),
    __param(4, (0, common_1.Query)('membershipStatus')),
    __param(5, (0, common_1.Query)('gender')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMemberReport", null);
__decorate([
    (0, common_1.Get)('positions'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('positionLevel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPositionReport", null);
__decorate([
    (0, common_1.Get)('contributions'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('paymentStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getContributionReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map