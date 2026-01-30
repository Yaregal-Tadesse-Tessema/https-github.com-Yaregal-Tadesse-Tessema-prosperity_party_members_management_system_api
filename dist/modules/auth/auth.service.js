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
    async validateUser(phone, password) {
        const user = await this.userRepository.findOne({
            where: { phone },
        });
        if (!user) {
            return null;
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('User is not active');
        }
        if (password !== user.password) {
            return null;
        }
        const { password: _, ...result } = user;
        return result;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.phone, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.userRepository.update(user.id, {
            lastLoginAt: new Date(),
        });
        await this.auditLogService.logAction({
            userId: user.id,
            username: user.phone || user.username,
            action: audit_log_entity_1.AuditAction.VIEW,
            entity: audit_log_entity_1.AuditEntity.USER,
            entityId: user.id,
            notes: 'User login',
        });
        const payload = { username: user.phone || user.username, sub: user.id, role: user.role };
        return {
            user,
            access_token: this.jwtService.sign(payload),
        };
    }
    async register(registerDto) {
        const existingByUsername = await this.userRepository.findOne({
            where: { username: registerDto.username },
        });
        if (existingByUsername) {
            throw new common_1.ConflictException('Username already exists');
        }
        if (registerDto.phone) {
            const existingByPhone = await this.userRepository.findOne({
                where: { phone: registerDto.phone },
            });
            if (existingByPhone) {
                throw new common_1.ConflictException('User already exists');
            }
        }
        const user = this.userRepository.create({
            username: registerDto.username,
            password: registerDto.password,
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
    async findAll(query, includePassword = false) {
        const where = {};
        if (query?.role != null) {
            where.role = query.role;
        }
        if (query?.isActive !== undefined) {
            where.isActive = query.isActive;
        }
        if (query?.search?.trim()) {
            const search = `%${query.search.trim()}%`;
            const users = await this.userRepository.find({
                where: [
                    { ...where, username: (0, typeorm_2.Like)(search) },
                    { ...where, fullName: (0, typeorm_2.Like)(search) },
                ],
                order: { createdAt: 'DESC' },
            });
            const seen = new Set();
            const deduped = users.filter((u) => {
                if (seen.has(u.id))
                    return false;
                seen.add(u.id);
                return true;
            });
            return deduped.map((u) => this.toUserResponse(u, includePassword));
        }
        const users = await this.userRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
        return users.map((u) => this.toUserResponse(u, includePassword));
    }
    toUserResponse(u, includePassword) {
        const base = {
            id: u.id,
            username: u.username,
            fullName: u.fullName,
            role: u.role,
            isActive: u.isActive,
            phone: u.phone,
            email: u.email,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            lastLoginAt: u.lastLoginAt,
        };
        if (includePassword) {
            return { ...base, password: u.password };
        }
        return base;
    }
    async findOne(id, includePassword = false) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (includePassword) {
            return user;
        }
        const { password: _, ...result } = user;
        return result;
    }
    async update(id, dto) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.fullName !== undefined)
            user.fullName = dto.fullName;
        if (dto.role !== undefined)
            user.role = dto.role;
        if (dto.phone !== undefined)
            user.phone = dto.phone;
        if (dto.email !== undefined)
            user.email = dto.email;
        if (dto.isActive !== undefined)
            user.isActive = dto.isActive;
        if (dto.password !== undefined && dto.password !== '')
            user.password = dto.password;
        const saved = await this.userRepository.save(user);
        const { password: _, ...result } = saved;
        return result;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.password !== currentPassword) {
            throw new common_1.UnauthorizedException('Invalid current password');
        }
        user.password = newPassword;
        await this.userRepository.save(user);
        return { message: 'Password updated successfully' };
    }
    async remove(id, currentUserId) {
        if (id === currentUserId) {
            throw new common_1.ForbiddenException('You cannot delete your own account');
        }
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.userRepository.update(id, { isActive: false });
    }
    async createDefaultAdmin() {
        const adminExists = await this.userRepository.findOne({
            where: { role: user_entity_1.UserRole.SYSTEM_ADMIN },
        });
        if (!adminExists) {
            const admin = this.userRepository.create({
                username: 'admin',
                password: 'admin123',
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