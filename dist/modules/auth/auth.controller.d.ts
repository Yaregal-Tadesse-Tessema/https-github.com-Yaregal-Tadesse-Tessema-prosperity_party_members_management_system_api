import { AuthService, LoginDto, RegisterDto, AuthResponse } from './auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<AuthResponse>;
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    getProfile(req: any): Promise<any>;
    findAllUsers(search?: string, role?: UserRole, isActive?: string, includePassword?: string): Promise<Partial<import("../../entities/user.entity").User>[]>;
    findOneUser(id: string, includePassword?: string): Promise<Partial<import("../../entities/user.entity").User>>;
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<Partial<import("../../entities/user.entity").User>>;
    removeUser(id: string, req: any): Promise<void>;
}
