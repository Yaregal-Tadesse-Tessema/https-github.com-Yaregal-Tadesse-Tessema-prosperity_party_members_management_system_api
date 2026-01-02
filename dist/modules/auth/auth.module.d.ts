import { OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
export declare class AuthModule implements OnModuleInit {
    private readonly authService;
    constructor(authService: AuthService);
    onModuleInit(): Promise<void>;
}
