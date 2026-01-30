"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const member_entity_1 = require("../../entities/member.entity");
const user_entity_1 = require("../../entities/user.entity");
const employment_info_entity_1 = require("../../entities/employment-info.entity");
const file_attachment_entity_1 = require("../../entities/file-attachment.entity");
const contribution_entity_1 = require("../../entities/contribution.entity");
const position_history_entity_1 = require("../../entities/position-history.entity");
const members_service_1 = require("./members.service");
const members_controller_1 = require("./members.controller");
const audit_log_module_1 = require("../audit/audit-log.module");
const families_module_1 = require("../families/families.module");
let MembersModule = class MembersModule {
};
exports.MembersModule = MembersModule;
exports.MembersModule = MembersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([member_entity_1.Member, user_entity_1.User, employment_info_entity_1.EmploymentInfo, file_attachment_entity_1.FileAttachment, contribution_entity_1.Contribution, position_history_entity_1.PositionHistory]),
            audit_log_module_1.AuditLogModule,
            families_module_1.FamiliesModule,
        ],
        controllers: [members_controller_1.MembersController],
        providers: [members_service_1.MembersService],
        exports: [members_service_1.MembersService],
    })
], MembersModule);
//# sourceMappingURL=members.module.js.map