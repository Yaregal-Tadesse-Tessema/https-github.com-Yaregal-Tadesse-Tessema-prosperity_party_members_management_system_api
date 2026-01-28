import { UserRole } from '../../../entities/user.entity';
export declare class UpdateUserDto {
    fullName?: string;
    role?: UserRole;
    phone?: string;
    email?: string;
    isActive?: boolean;
    password?: string;
}
