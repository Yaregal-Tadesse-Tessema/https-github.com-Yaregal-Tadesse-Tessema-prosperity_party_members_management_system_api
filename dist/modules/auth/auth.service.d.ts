import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../../entities/user.entity';
import { AuditLogService } from '../audit/audit-log.service';
export interface LoginDto {
    username: string;
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
    validateUser(username: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<AuthResponse>;
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    getProfile(userId: string): Promise<Partial<User>>;
    createDefaultAdmin(): Promise<void>;
}
