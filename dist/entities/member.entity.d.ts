import { PositionHistory } from './position-history.entity';
import { Contribution } from './contribution.entity';
import { EmploymentInfo } from './employment-info.entity';
import { FileAttachment } from './file-attachment.entity';
import { Family } from './family.entity';
export declare enum MembershipStatus {
    CANDIDATE = "candidate",
    SUPPORTIVE_MEMBER = "supportive_member",
    MEMBER = "member"
}
export declare enum Status {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare enum Gender {
    MALE = "male",
    FEMALE = "female"
}
export declare enum EducationLevel {
    NONE = "none",
    PRIMARY = "primary",
    SECONDARY = "secondary",
    DIPLOMA = "diploma",
    BACHELOR = "bachelor",
    MASTERS = "masters",
    PHD = "phd",
    OTHER = "other"
}
export declare enum WorkSector {
    PRIVATE = "private",
    GOVERNMENT = "government",
    NGO = "ngo",
    SELF_EMPLOYED = "self_employed",
    OTHER = "other"
}
export declare enum FamilyRelationship {
    HEAD = "head",
    SPOUSE = "spouse",
    CHILD = "child",
    PARENT = "parent",
    SIBLING = "sibling",
    GRANDPARENT = "grandparent",
    GRANDCHILD = "grandchild",
    OTHER = "other"
}
export declare enum MaritalStatus {
    SINGLE = "single",
    MARRIED = "married",
    DIVORCED = "divorced",
    WIDOWED = "widowed",
    SEPARATED = "separated"
}
export declare class Member {
    id: string;
    partyId: number;
    nationalId?: string;
    fullNameAmharic: string;
    fullNameEnglish: string;
    gender: Gender;
    dateOfBirth: Date;
    ethnicOrigin?: string;
    birthState?: string;
    birthZone?: string;
    birthCity?: string;
    birthKebele?: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    educationLevel?: EducationLevel;
    educationFieldOfStudy?: string;
    languagesSpoken?: string[];
    leadershipExperience?: number;
    workExperience?: number;
    partyResponsibility?: string;
    previouslyPoliticalPartyMember: boolean;
    workSector?: WorkSector;
    subCity: string;
    woreda: string;
    kebele: string;
    detailedAddress?: string;
    membershipStatus: MembershipStatus;
    status: Status;
    registrationDate: Date;
    notes?: string;
    educationalDocumentsFile?: string;
    experienceDocumentsFile?: string;
    familyId?: string;
    family?: Family;
    familyRelationship?: FamilyRelationship;
    maritalStatus?: MaritalStatus;
    salaryAmount?: number;
    contributionPercentage?: number;
    employmentHistory?: EmploymentInfo[];
    positionHistory: PositionHistory[];
    contributions: Contribution[];
    attachments: FileAttachment[];
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
