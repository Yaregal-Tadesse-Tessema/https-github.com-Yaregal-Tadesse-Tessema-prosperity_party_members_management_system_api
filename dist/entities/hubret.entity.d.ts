import { Family } from './family.entity';
import { Member } from './member.entity';
export declare enum HubretStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    DISSOLVED = "dissolved"
}
export declare class Hubret {
    id: string;
    hubretId: string;
    hubretNameAmharic: string;
    hubretNameEnglish: string;
    status: HubretStatus;
    leaderMemberId?: string;
    leader?: Member;
    politicalSectorHeadMemberId?: string;
    politicalSectorHead?: Member;
    organizationSectorHeadMemberId?: string;
    organizationSectorHead?: Member;
    financeSectorHeadMemberId?: string;
    financeSectorHead?: Member;
    mediaSectorHeadMemberId?: string;
    mediaSectorHead?: Member;
    deputyPoliticalSectorHeadMemberId?: string;
    deputyPoliticalSectorHead?: Member;
    deputyOrganizationSectorHeadMemberId?: string;
    deputyOrganizationSectorHead?: Member;
    deputyFinanceSectorHeadMemberId?: string;
    deputyFinanceSectorHead?: Member;
    contactPerson?: string;
    phone?: string;
    email?: string;
    region?: string;
    zone?: string;
    woreda?: string;
    kebele?: string;
    totalFamilies: number;
    totalMembers: number;
    activeMembers: number;
    notes?: string;
    families: Family[];
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
