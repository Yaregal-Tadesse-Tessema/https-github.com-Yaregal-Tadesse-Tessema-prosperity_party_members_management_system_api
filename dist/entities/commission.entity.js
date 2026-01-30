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
exports.Commission = void 0;
const typeorm_1 = require("typeorm");
const hubret_entity_1 = require("./hubret.entity");
const member_entity_1 = require("./member.entity");
let Commission = class Commission {
    id;
    hubretId;
    hubret;
    member1Id;
    member1;
    member2Id;
    member2;
    member3Id;
    member3;
    member4Id;
    member4;
    member5Id;
    member5;
    notes;
    createdAt;
    updatedAt;
};
exports.Commission = Commission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Commission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Commission.prototype, "hubretId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hubret_entity_1.Hubret, (hubret) => hubret.id, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'hubretId' }),
    __metadata("design:type", hubret_entity_1.Hubret)
], Commission.prototype, "hubret", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Commission.prototype, "member1Id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'member1Id' }),
    __metadata("design:type", member_entity_1.Member)
], Commission.prototype, "member1", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Commission.prototype, "member2Id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'member2Id' }),
    __metadata("design:type", member_entity_1.Member)
], Commission.prototype, "member2", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Commission.prototype, "member3Id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'member3Id' }),
    __metadata("design:type", member_entity_1.Member)
], Commission.prototype, "member3", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Commission.prototype, "member4Id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'member4Id' }),
    __metadata("design:type", member_entity_1.Member)
], Commission.prototype, "member4", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Commission.prototype, "member5Id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'member5Id' }),
    __metadata("design:type", member_entity_1.Member)
], Commission.prototype, "member5", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Commission.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Commission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Commission.prototype, "updatedAt", void 0);
exports.Commission = Commission = __decorate([
    (0, typeorm_1.Entity)('commissions')
], Commission);
//# sourceMappingURL=commission.entity.js.map