import { Member } from './member.entity';
export declare enum EmploymentStatus {
    EMPLOYED = "employed",
    SELF_EMPLOYED = "self_employed",
    UNEMPLOYED = "unemployed"
}
export declare enum SalaryRange {
    RANGE_0_5000 = "0-5000",
    RANGE_5001_10000 = "5001-10000",
    RANGE_10001_20000 = "10001-20000",
    RANGE_20001_30000 = "20001-30000",
    RANGE_30001_50000 = "30001-50000",
    RANGE_50001_PLUS = "50001+"
}
export declare class EmploymentInfo {
    id: string;
    employmentStatus: EmploymentStatus;
    organizationName?: string;
    jobTitle?: string;
    workSector?: string;
    monthlySalary?: number;
    salaryRange?: SalaryRange;
    additionalNotes?: string;
    memberId?: string;
    member?: Member;
    createdAt: Date;
    updatedAt: Date;
}
