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
exports.Member = exports.MaritalStatus = exports.FamilyRelationship = exports.WorkSector = exports.EducationLevel = exports.Gender = exports.Status = exports.MembershipStatus = void 0;
const typeorm_1 = require("typeorm");
const position_history_entity_1 = require("./position-history.entity");
const contribution_entity_1 = require("./contribution.entity");
const employment_info_entity_1 = require("./employment-info.entity");
const file_attachment_entity_1 = require("./file-attachment.entity");
const family_entity_1 = require("./family.entity");
var MembershipStatus;
(function (MembershipStatus) {
    MembershipStatus["CANDIDATE"] = "candidate";
    MembershipStatus["SUPPORTIVE_MEMBER"] = "supportive_member";
    MembershipStatus["MEMBER"] = "member";
})(MembershipStatus || (exports.MembershipStatus = MembershipStatus = {}));
var Status;
(function (Status) {
    Status["ACTIVE"] = "active";
    Status["INACTIVE"] = "inactive";
    Status["SUSPENDED"] = "suspended";
})(Status || (exports.Status = Status = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
})(Gender || (exports.Gender = Gender = {}));
var EducationLevel;
(function (EducationLevel) {
    EducationLevel["NONE"] = "none";
    EducationLevel["PRIMARY"] = "primary";
    EducationLevel["SECONDARY"] = "secondary";
    EducationLevel["DIPLOMA"] = "diploma";
    EducationLevel["BACHELOR"] = "bachelor";
    EducationLevel["MASTERS"] = "masters";
    EducationLevel["PHD"] = "phd";
    EducationLevel["OTHER"] = "other";
})(EducationLevel || (exports.EducationLevel = EducationLevel = {}));
var WorkSector;
(function (WorkSector) {
    WorkSector["PRIVATE"] = "private";
    WorkSector["GOVERNMENT"] = "government";
    WorkSector["NGO"] = "ngo";
    WorkSector["SELF_EMPLOYED"] = "self_employed";
    WorkSector["OTHER"] = "other";
})(WorkSector || (exports.WorkSector = WorkSector = {}));
var FamilyRelationship;
(function (FamilyRelationship) {
    FamilyRelationship["HEAD"] = "head";
    FamilyRelationship["SPOUSE"] = "spouse";
    FamilyRelationship["CHILD"] = "child";
    FamilyRelationship["PARENT"] = "parent";
    FamilyRelationship["SIBLING"] = "sibling";
    FamilyRelationship["GRANDPARENT"] = "grandparent";
    FamilyRelationship["GRANDCHILD"] = "grandchild";
    FamilyRelationship["OTHER"] = "other";
})(FamilyRelationship || (exports.FamilyRelationship = FamilyRelationship = {}));
var MaritalStatus;
(function (MaritalStatus) {
    MaritalStatus["SINGLE"] = "single";
    MaritalStatus["MARRIED"] = "married";
    MaritalStatus["DIVORCED"] = "divorced";
    MaritalStatus["WIDOWED"] = "widowed";
    MaritalStatus["SEPARATED"] = "separated";
})(MaritalStatus || (exports.MaritalStatus = MaritalStatus = {}));
let Member = class Member {
    id;
    partyId;
    nationalId;
    fullNameAmharic;
    fullNameEnglish;
    gender;
    dateOfBirth;
    ethnicOrigin;
    birthState;
    birthZone;
    birthCity;
    birthKebele;
    primaryPhone;
    secondaryPhone;
    email;
    educationLevel;
    educationFieldOfStudy;
    languagesSpoken;
    leadershipExperience;
    workExperience;
    partyResponsibility;
    previouslyPoliticalPartyMember;
    workSector;
    subCity;
    woreda;
    kebele;
    detailedAddress;
    membershipStatus;
    status;
    registrationDate;
    notes;
    familyId;
    family;
    familyRelationship;
    contributionPercentage;
    maritalStatus;
    salaryAmount;
    employmentHistory;
    positionHistory;
    contributions;
    attachments;
    createdAt;
    updatedAt;
    createdBy;
    updatedBy;
};
exports.Member = Member;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Member.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Member.prototype, "partyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true }),
    __metadata("design:type", String)
], Member.prototype, "nationalId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Member.prototype, "fullNameAmharic", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Member.prototype, "fullNameEnglish", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
    }),
    __metadata("design:type", String)
], Member.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Member.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "ethnicOrigin", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "birthState", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "birthZone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "birthCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "birthKebele", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Member.prototype, "primaryPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "secondaryPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true
    }),
    __metadata("design:type", String)
], Member.prototype, "educationLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "educationFieldOfStudy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Member.prototype, "languagesSpoken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Member.prototype, "leadershipExperience", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], Member.prototype, "workExperience", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "partyResponsibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Member.prototype, "previouslyPoliticalPartyMember", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true
    }),
    __metadata("design:type", String)
], Member.prototype, "workSector", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Member.prototype, "subCity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Member.prototype, "woreda", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Member.prototype, "kebele", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "detailedAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: MembershipStatus.SUPPORTIVE_MEMBER,
    }),
    __metadata("design:type", String)
], Member.prototype, "membershipStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: Status.ACTIVE,
    }),
    __metadata("design:type", String)
], Member.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Member.prototype, "registrationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "familyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => family_entity_1.Family, family => family.members, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'familyId' }),
    __metadata("design:type", family_entity_1.Family)
], Member.prototype, "family", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true
    }),
    __metadata("design:type", String)
], Member.prototype, "familyRelationship", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Member.prototype, "contributionPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true
    }),
    __metadata("design:type", String)
], Member.prototype, "maritalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Member.prototype, "salaryAmount", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => employment_info_entity_1.EmploymentInfo, employment => employment.member, { cascade: true }),
    __metadata("design:type", Array)
], Member.prototype, "employmentHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => position_history_entity_1.PositionHistory, position => position.member, { cascade: true }),
    __metadata("design:type", Array)
], Member.prototype, "positionHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => contribution_entity_1.Contribution, contribution => contribution.member, { cascade: true }),
    __metadata("design:type", Array)
], Member.prototype, "contributions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_attachment_entity_1.FileAttachment, attachment => attachment.member, { cascade: true }),
    __metadata("design:type", Array)
], Member.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Member.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Member.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "updatedBy", void 0);
exports.Member = Member = __decorate([
    (0, typeorm_1.Entity)('members')
], Member);
//# sourceMappingURL=member.entity.js.map