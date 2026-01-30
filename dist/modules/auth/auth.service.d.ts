import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../../entities/user.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { UpdateUserDto } from './dto/update-user.dto';
export interface FindUsersQuery {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
}
export interface LoginDto {
    phone: string;
    password: string;
}
export interface RegisterDto {
    username: string;
    password: string;
    fullName: string;
    role?: UserRole;
    phone?: string;
    email?: string;
}
export interface AuthResponse {
    user: Partial<User>;
    access_token: string;
}
export declare class AuthService {
    private userRepository;
    private jwtService;
    private auditLogService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, auditLogService: AuditLogService);
    validateUser(phone: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<AuthResponse>;
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    getProfile(userId: string): Promise<Partial<User>>;
    findAll(query?: FindUsersQuery, includePassword?: boolean): Promise<Partial<User>[]>;
    private toUserResponse;
    findOne(id: string, includePassword?: boolean): Promise<Partial<User>>;
    update(id: string, dto: UpdateUserDto): Promise<Partial<User>>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    remove(id: string, currentUserId: string): Promise<void>;
    createDefaultAdmin(): Promise<void>;
}
