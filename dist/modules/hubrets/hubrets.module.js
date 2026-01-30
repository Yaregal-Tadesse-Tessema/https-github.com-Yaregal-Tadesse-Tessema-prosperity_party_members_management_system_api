"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubretsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const hubrets_service_1 = require("./hubrets.service");
const hubrets_controller_1 = require("./hubrets.controller");
const hubret_entity_1 = require("../../entities/hubret.entity");
const family_entity_1 = require("../../entities/family.entity");
const commission_entity_1 = require("../../entities/commission.entity");
const audit_log_service_1 = require("../audit/audit-log.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let HubretsModule = class HubretsModule {
};
exports.HubretsModule = HubretsModule;
exports.HubretsModule = HubretsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([hubret_entity_1.Hubret, family_entity_1.Family, commission_entity_1.Commission, audit_log_entity_1.AuditLog])],
        providers: [hubrets_service_1.HubretsService, audit_log_service_1.AuditLogService],
        controllers: [hubrets_controller_1.HubretsController],
        exports: [hubrets_service_1.HubretsService],
    })
], HubretsModule);
//# sourceMappingURL=hubrets.module.js.map