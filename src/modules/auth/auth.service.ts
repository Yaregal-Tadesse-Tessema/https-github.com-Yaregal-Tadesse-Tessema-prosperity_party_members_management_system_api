import { Injectable, UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../../entities/user.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private auditLogService: AuditLogService,
  ) {}

  async validateUser(phone: string, password: string): Promise<any> {
    // Find user by phone first (active or inactive), so we can show a proper "inactive" message
    const user = await this.userRepository.findOne({
      where: { phone },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new ForbiddenException('User is not active');
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
    const existingByUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingByUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if phone already exists (if provided)
    if (registerDto.phone) {
      const existingByPhone = await this.userRepository.findOne({
        where: { phone: registerDto.phone },
      });

      if (existingByPhone) {
        throw new ConflictException('User already exists');
      }
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

  async findAll(query?: FindUsersQuery, includePassword = false): Promise<Partial<User>[]> {
    const where: any = {};
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
          { ...where, username: Like(search) },
          { ...where, fullName: Like(search) },
        ],
        order: { createdAt: 'DESC' },
      });
      const seen = new Set<string>();
      const deduped = users.filter((u) => {
        if (seen.has(u.id)) return false;
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

  private toUserResponse(u: User, includePassword: boolean): Partial<User> {
    const base: Partial<User> = {
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

  async findOne(id: string, includePassword = false): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (includePassword) {
      return user;
    }
    const { password: _, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password !== undefined && dto.password !== '') user.password = dto.password;
    const saved = await this.userRepository.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.update(id, { isActive: false });
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
