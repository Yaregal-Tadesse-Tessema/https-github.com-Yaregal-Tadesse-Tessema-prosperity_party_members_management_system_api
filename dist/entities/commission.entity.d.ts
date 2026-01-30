import { Hubret } from './hubret.entity';
import { Member } from './member.entity';
export declare class Commission {
    id: string;
    hubretId: string;
    hubret?: Hubret;
    member1Id?: string;
    member1?: Member;
    member2Id?: string;
    member2?: Member;
    member3Id?: string;
    member3?: Member;
    member4Id?: string;
    member4?: Member;
    member5Id?: string;
    member5?: Member;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
