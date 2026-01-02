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
exports.Family = exports.FamilyStatus = exports.FamilyType = void 0;
const typeorm_1 = require("typeorm");
const member_entity_1 = require("./member.entity");
var FamilyType;
(function (FamilyType) {
    FamilyType["NUCLEAR"] = "nuclear";
    FamilyType["EXTENDED"] = "extended";
    FamilyType["SINGLE_PARENT"] = "single_parent";
    FamilyType["BLENDED"] = "blended";
    FamilyType["OTHER"] = "other";
})(FamilyType || (exports.FamilyType = FamilyType = {}));
var FamilyStatus;
(function (FamilyStatus) {
    FamilyStatus["ACTIVE"] = "active";
    FamilyStatus["INACTIVE"] = "inactive";
    FamilyStatus["DISSOLVED"] = "dissolved";
})(FamilyStatus || (exports.FamilyStatus = FamilyStatus = {}));
let Family = class Family {
    id;
    familyId;
    familyNameAmharic;
    familyNameEnglish;
    familyType;
    status;
    headMemberId;
    contactMemberId;
    totalMembers;
    activeMembers;
    notes;
    members;
    createdAt;
    updatedAt;
    createdBy;
    updatedBy;
};
exports.Family = Family;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Family.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Family.prototype, "familyId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Family.prototype, "familyNameAmharic", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Family.prototype, "familyNameEnglish", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: FamilyType.NUCLEAR,
    }),
    __metadata("design:type", String)
], Family.prototype, "familyType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: FamilyStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Family.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Family.prototype, "headMemberId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Family.prototype, "contactMemberId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Family.prototype, "totalMembers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Family.prototype, "activeMembers", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Family.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => member_entity_1.Member, member => member.family),
    __metadata("design:type", Array)
], Family.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Family.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Family.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Family.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Family.prototype, "updatedBy", void 0);
exports.Family = Family = __decorate([
    (0, typeorm_1.Entity)('families')
], Family);
//# sourceMappingURL=family.entity.js.map