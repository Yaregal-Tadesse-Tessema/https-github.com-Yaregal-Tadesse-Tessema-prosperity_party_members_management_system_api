import { Member } from './member.entity';
export declare enum FamilyType {
    NUCLEAR = "nuclear",
    EXTENDED = "extended",
    SINGLE_PARENT = "single_parent",
    BLENDED = "blended",
    OTHER = "other"
}
export declare enum FamilyStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    DISSOLVED = "dissolved"
}
export declare class Family {
    id: string;
    familyId: string;
    familyNameAmharic: string;
    familyNameEnglish: string;
    familyType: FamilyType;
    status: FamilyStatus;
    headMemberId?: string;
    contactMemberId?: string;
    totalMembers: number;
    activeMembers: number;
    notes?: string;
    members: Member[];
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
