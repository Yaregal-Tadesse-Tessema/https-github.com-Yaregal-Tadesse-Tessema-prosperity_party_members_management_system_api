export declare enum UserRole {
    SYSTEM_ADMIN = "system_admin",
    PARTY_ADMIN = "party_admin",
    FINANCE_OFFICER = "finance_officer",
    DATA_ENTRY_OFFICER = "data_entry_officer",
    READ_ONLY_VIEWER = "read_only_viewer"
}
export declare class User {
    id: string;
    username: string;
    password: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    phone?: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
