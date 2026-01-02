import { PositionLevel } from './position-history.entity';
import { SalaryRange } from './employment-info.entity';
export declare enum RuleType {
    SALARY_RANGE = "salary_range",
    POSITION_LEVEL = "position_level",
    SPECIAL_CATEGORY = "special_category"
}
export declare class ContributionRule {
    id: string;
    name: string;
    ruleType: RuleType;
    salaryRange?: SalaryRange;
    positionLevel?: PositionLevel;
    specialCategory?: string;
    contributionAmount: number;
    percentageOfSalary?: number;
    isActive: boolean;
    description?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
