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
exports.EmploymentInfo = exports.SalaryRange = exports.EmploymentStatus = void 0;
const typeorm_1 = require("typeorm");
const member_entity_1 = require("./member.entity");
var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["EMPLOYED"] = "employed";
    EmploymentStatus["SELF_EMPLOYED"] = "self_employed";
    EmploymentStatus["UNEMPLOYED"] = "unemployed";
})(EmploymentStatus || (exports.EmploymentStatus = EmploymentStatus = {}));
var SalaryRange;
(function (SalaryRange) {
    SalaryRange["RANGE_0_5000"] = "0-5000";
    SalaryRange["RANGE_5001_10000"] = "5001-10000";
    SalaryRange["RANGE_10001_20000"] = "10001-20000";
    SalaryRange["RANGE_20001_30000"] = "20001-30000";
    SalaryRange["RANGE_30001_50000"] = "30001-50000";
    SalaryRange["RANGE_50001_PLUS"] = "50001+";
})(SalaryRange || (exports.SalaryRange = SalaryRange = {}));
let EmploymentInfo = class EmploymentInfo {
    id;
    employmentStatus;
    organizationName;
    jobTitle;
    workSector;
    monthlySalary;
    salaryRange;
    additionalNotes;
    memberId;
    member;
    createdAt;
    updatedAt;
};
exports.EmploymentInfo = EmploymentInfo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmploymentInfo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
    }),
    __metadata("design:type", String)
], EmploymentInfo.prototype, "employmentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmploymentInfo.prototype, "organizationName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmploymentInfo.prototype, "jobTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmploymentInfo.prototype, "workSector", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], EmploymentInfo.prototype, "monthlySalary", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmploymentInfo.prototype, "salaryRange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EmploymentInfo.prototype, "additionalNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EmploymentInfo.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, member => member.employmentHistory, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'memberId' }),
    __metadata("design:type", member_entity_1.Member)
], EmploymentInfo.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EmploymentInfo.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EmploymentInfo.prototype, "updatedAt", void 0);
exports.EmploymentInfo = EmploymentInfo = __decorate([
    (0, typeorm_1.Entity)('employment_info')
], EmploymentInfo);
//# sourceMappingURL=employment-info.entity.js.map