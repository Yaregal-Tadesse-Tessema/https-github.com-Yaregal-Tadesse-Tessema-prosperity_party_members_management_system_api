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
exports.ContributionRule = exports.RuleType = void 0;
const typeorm_1 = require("typeorm");
const position_history_entity_1 = require("./position-history.entity");
const employment_info_entity_1 = require("./employment-info.entity");
var RuleType;
(function (RuleType) {
    RuleType["SALARY_RANGE"] = "salary_range";
    RuleType["POSITION_LEVEL"] = "position_level";
    RuleType["SPECIAL_CATEGORY"] = "special_category";
})(RuleType || (exports.RuleType = RuleType = {}));
let ContributionRule = class ContributionRule {
    id;
    name;
    ruleType;
    salaryRange;
    positionLevel;
    specialCategory;
    contributionAmount;
    percentageOfSalary;
    isActive;
    description;
    effectiveFrom;
    effectiveTo;
    createdAt;
    updatedAt;
    createdBy;
    updatedBy;
};
exports.ContributionRule = ContributionRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContributionRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContributionRule.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
    }),
    __metadata("design:type", String)
], ContributionRule.prototype, "ruleType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true,
    }),
    __metadata("design:type", String)
], ContributionRule.prototype, "salaryRange", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true,
    }),
    __metadata("design:type", String)
], ContributionRule.prototype, "positionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContributionRule.prototype, "specialCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ContributionRule.prototype, "contributionAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ContributionRule.prototype, "percentageOfSalary", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ContributionRule.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ContributionRule.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], ContributionRule.prototype, "effectiveFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], ContributionRule.prototype, "effectiveTo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ContributionRule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ContributionRule.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContributionRule.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContributionRule.prototype, "updatedBy", void 0);
exports.ContributionRule = ContributionRule = __decorate([
    (0, typeorm_1.Entity)('contribution_rules')
], ContributionRule);
//# sourceMappingURL=contribution-rule.entity.js.map