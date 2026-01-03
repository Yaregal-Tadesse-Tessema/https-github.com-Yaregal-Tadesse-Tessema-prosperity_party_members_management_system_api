import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../../entities/user.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';

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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private auditLogService: AuditLogService,
  ) {}

  async validateUser(phone: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { phone, isActive: true },
    });

    if (!user) {
      return null;
    }

    // Plain text password comparison
    if (password !== user.password) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.phone, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Log the login action
    await this.auditLogService.logAction({
      userId: user.id,
      username: user.phone || user.username,
      action: AuditAction.VIEW,
      entity: AuditEntity.USER,
      entityId: user.id,
      notes: 'User login',
    });

    const payload = { username: user.phone || user.username, sub: user.id, role: user.role };
    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if username already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Create user with plain text password
    const user = this.userRepository.create({
      username: registerDto.username,
      password: registerDto.password, // Plain text
      fullName: registerDto.fullName,
      role: registerDto.role || UserRole.DATA_ENTRY_OFFICER,
      phone: registerDto.phone,
      email: registerDto.email,
    });

    const savedUser = await this.userRepository.save(user);

    // Log the registration
    await this.auditLogService.logAction({
      userId: savedUser.id,
      username: savedUser.username,
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
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

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async createDefaultAdmin(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { role: UserRole.SYSTEM_ADMIN },
    });

    if (!adminExists) {
      const admin = this.userRepository.create({
        username: 'admin',
        password: 'admin123', // Plain text
        fullName: 'System Administrator',
        role: UserRole.SYSTEM_ADMIN,
        phone: '+251911000000',
        email: 'admin@prosperityparty.et',
      });

      await this.userRepository.save(admin);
      console.log('Default admin user created: username=admin, password=admin123');
    }
  }
}
