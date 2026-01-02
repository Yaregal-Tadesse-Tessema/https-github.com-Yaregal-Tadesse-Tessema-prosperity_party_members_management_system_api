import { AuthService, LoginDto, RegisterDto, AuthResponse } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<AuthResponse>;
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    getProfile(req: any): Promise<any>;
}
