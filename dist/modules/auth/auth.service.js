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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../../entities/user.entity");
const audit_log_service_1 = require("../audit/audit-log.service");
const audit_log_entity_1 = require("../../entities/audit-log.entity");
let AuthService = class AuthService {
    userRepository;
    jwtService;
    auditLogService;
    constructor(userRepository, jwtService, auditLogService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
    }
    async validateUser(username, password) {
        const user = await this.userRepository.findOne({
            where: { username, isActive: true },
        });
        if (!user) {
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }
        const { password: _, ...result } = user;
        return result;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.userRepository.update(user.id, {
            lastLoginAt: new Date(),
        });
        await this.auditLogService.logAction({
            userId: user.id,
            username: user.username,
            action: audit_log_entity_1.AuditAction.VIEW,
            entity: audit_log_entity_1.AuditEntity.USER,
            entityId: user.id,
            notes: 'User login',
        });
        const payload = { username: user.username, sub: user.id, role: user.role };
        return {
            user,
            access_token: this.jwtService.sign(payload),
        };
    }
    async register(registerDto) {
        const existingUser = await this.userRepository.findOne({
            where: { username: registerDto.username },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Username already exists');
        }
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);
        const user = this.userRepository.create({
            username: registerDto.username,
            password: hashedPassword,
            fullName: registerDto.fullName,
            role: registerDto.role || user_entity_1.UserRole.DATA_ENTRY_OFFICER,
            phone: registerDto.phone,
            email: registerDto.email,
        });
        const savedUser = await this.userRepository.save(user);
        await this.auditLogService.logAction({
            userId: savedUser.id,
            username: savedUser.username,
            action: audit_log_entity_1.AuditAction.CREATE,
            entity: audit_log_entity_1.AuditEntity.USER,
            entityId: savedUser.id,
            newValues: { username: savedUser.username, fullName: savedUser.fullName, role: savedUser.role },
            notes: 'User registration',
        });
        const { password: _, ...result } = savedUser;
        const payload = { username: savedUser.username, sub: savedUser.id, role: savedUser.role };
        return {
            user: result,
            access_token: this.jwtService.sign(payload),
        };
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, isActive: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const { password: _, ...result } = user;
        return result;
    }
    async createDefaultAdmin() {
        const adminExists = await this.userRepository.findOne({
            where: { role: user_entity_1.UserRole.SYSTEM_ADMIN },
        });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 12);
            const admin = this.userRepository.create({
                username: 'admin',
                password: hashedPassword,
                fullName: 'System Administrator',
                role: user_entity_1.UserRole.SYSTEM_ADMIN,
                phone: '+251911000000',
                email: 'admin@prosperityparty.et',
            });
            await this.userRepository.save(admin);
            console.log('Default admin user created: username=admin, password=admin123');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        audit_log_service_1.AuditLogService])
], AuthService);
//# sourceMappingURL=auth.service.js.map