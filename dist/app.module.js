"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_entity_1 = require("./entities/user.entity");
const member_entity_1 = require("./entities/member.entity");
const employment_info_entity_1 = require("./entities/employment-info.entity");
const position_history_entity_1 = require("./entities/position-history.entity");
const contribution_entity_1 = require("./entities/contribution.entity");
const contribution_rule_entity_1 = require("./entities/contribution-rule.entity");
const file_attachment_entity_1 = require("./entities/file-attachment.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const family_entity_1 = require("./entities/family.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const audit_log_module_1 = require("./modules/audit/audit-log.module");
const members_module_1 = require("./modules/members/members.module");
const positions_module_1 = require("./modules/positions/positions.module");
const contributions_module_1 = require("./modules/contributions/contributions.module");
const reports_module_1 = require("./modules/reports/reports.module");
const files_module_1 = require("./modules/files/files.module");
const families_module_1 = require("./modules/families/families.module");
const seeder_module_1 = require("./seeder/seeder.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                password: 'yaya@1984',
                database: 'prosperity_party_members_management_system_dev',
                entities: [
                    user_entity_1.User,
                    member_entity_1.Member,
                    employment_info_entity_1.EmploymentInfo,
                    position_history_entity_1.PositionHistory,
                    contribution_entity_1.Contribution,
                    contribution_rule_entity_1.ContributionRule,
                    file_attachment_entity_1.FileAttachment,
                    audit_log_entity_1.AuditLog,
                    family_entity_1.Family,
                ],
                synchronize: process.env.NODE_ENV !== 'production',
                logging: process.env.NODE_ENV === 'development',
            }),
            auth_module_1.AuthModule,
            audit_log_module_1.AuditLogModule,
            members_module_1.MembersModule,
            positions_module_1.PositionsModule,
            contributions_module_1.ContributionsModule,
            reports_module_1.ReportsModule,
            files_module_1.FilesModule,
            families_module_1.FamiliesModule,
            seeder_module_1.SeederModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map