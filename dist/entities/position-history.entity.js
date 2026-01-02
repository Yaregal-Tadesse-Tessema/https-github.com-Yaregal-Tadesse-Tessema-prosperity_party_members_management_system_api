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
exports.PositionHistory = exports.PositionStatus = exports.PositionLevel = void 0;
const typeorm_1 = require("typeorm");
const member_entity_1 = require("./member.entity");
var PositionLevel;
(function (PositionLevel) {
    PositionLevel["CELL"] = "cell";
    PositionLevel["WOREDA"] = "woreda";
    PositionLevel["SUB_CITY"] = "sub_city";
    PositionLevel["CITY"] = "city";
    PositionLevel["REGIONAL"] = "regional";
})(PositionLevel || (exports.PositionLevel = PositionLevel = {}));
var PositionStatus;
(function (PositionStatus) {
    PositionStatus["ACTIVE"] = "active";
    PositionStatus["COMPLETED"] = "completed";
    PositionStatus["REVOKED"] = "revoked";
})(PositionStatus || (exports.PositionStatus = PositionStatus = {}));
let PositionHistory = class PositionHistory {
    id;
    memberId;
    member;
    positionTitle;
    positionLevel;
    startDate;
    endDate;
    appointingAuthority;
    status;
    responsibilities;
    achievements;
    createdAt;
    updatedAt;
    createdBy;
    updatedBy;
};
exports.PositionHistory = PositionHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PositionHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PositionHistory.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, member => member.positionHistory),
    (0, typeorm_1.JoinColumn)({ name: 'memberId' }),
    __metadata("design:type", member_entity_1.Member)
], PositionHistory.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PositionHistory.prototype, "positionTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
    }),
    __metadata("design:type", String)
], PositionHistory.prototype, "positionLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], PositionHistory.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PositionHistory.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PositionHistory.prototype, "appointingAuthority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: PositionStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], PositionHistory.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PositionHistory.prototype, "responsibilities", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PositionHistory.prototype, "achievements", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PositionHistory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PositionHistory.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PositionHistory.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PositionHistory.prototype, "updatedBy", void 0);
exports.PositionHistory = PositionHistory = __decorate([
    (0, typeorm_1.Entity)('position_history')
], PositionHistory);
//# sourceMappingURL=position-history.entity.js.map