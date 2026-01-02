import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../entities/user.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';

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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private auditLogService: AuditLogService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
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

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
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
      username: user.username,
      action: AuditAction.VIEW,
      entity: AuditEntity.USER,
      entityId: user.id,
      notes: 'User login',
    });

    const payload = { username: user.username, sub: user.id, role: user.role };
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

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
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
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const admin = this.userRepository.create({
        username: 'admin',
        password: hashedPassword,
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
