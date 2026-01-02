import { Member } from './member.entity';
export declare enum PositionLevel {
    CELL = "cell",
    WOREDA = "woreda",
    SUB_CITY = "sub_city",
    CITY = "city",
    REGIONAL = "regional"
}
export declare enum PositionStatus {
    ACTIVE = "active",
    COMPLETED = "completed",
    REVOKED = "revoked"
}
export declare class PositionHistory {
    id: string;
    memberId: string;
    member: Member;
    positionTitle: string;
    positionLevel: PositionLevel;
    startDate: Date;
    endDate?: Date;
    appointingAuthority?: string;
    status: PositionStatus;
    responsibilities?: string;
    achievements?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
