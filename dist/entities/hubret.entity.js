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
exports.Hubret = exports.HubretStatus = void 0;
const typeorm_1 = require("typeorm");
const family_entity_1 = require("./family.entity");
var HubretStatus;
(function (HubretStatus) {
    HubretStatus["ACTIVE"] = "active";
    HubretStatus["INACTIVE"] = "inactive";
    HubretStatus["DISSOLVED"] = "dissolved";
})(HubretStatus || (exports.HubretStatus = HubretStatus = {}));
let Hubret = class Hubret {
    id;
    hubretId;
    hubretNameAmharic;
    hubretNameEnglish;
    status;
    leaderMemberId;
    contactPerson;
    phone;
    email;
    region;
    zone;
    woreda;
    kebele;
    totalFamilies;
    totalMembers;
    activeMembers;
    notes;
    families;
    createdAt;
    updatedAt;
    createdBy;
    updatedBy;
};
exports.Hubret = Hubret;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Hubret.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Hubret.prototype, "hubretId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hubret.prototype, "hubretNameAmharic", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hubret.prototype, "hubretNameEnglish", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: HubretStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Hubret.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "leaderMemberId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "contactPerson", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "zone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "woreda", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "kebele", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Hubret.prototype, "totalFamilies", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Hubret.prototype, "totalMembers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Hubret.prototype, "activeMembers", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => family_entity_1.Family, family => family.hubret),
    __metadata("design:type", Array)
], Hubret.prototype, "families", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Hubret.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Hubret.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Hubret.prototype, "updatedBy", void 0);
exports.Hubret = Hubret = __decorate([
    (0, typeorm_1.Entity)('hubrets')
], Hubret);
//# sourceMappingURL=hubret.entity.js.map