import { Member } from './member.entity';
export declare enum PaymentMethod {
    CASH = "cash",
    BANK = "bank",
    MOBILE_MONEY = "mobile_money"
}
export declare enum PaymentStatus {
    PAID = "paid",
    PARTIALLY_PAID = "partially_paid",
    UNPAID = "unpaid"
}
export declare enum ContributionType {
    FIXED_AMOUNT = "fixed_amount",
    PERCENTAGE_OF_SALARY = "percentage_of_salary"
}
export declare class Contribution {
    id: string;
    memberId: string;
    member: Member;
    paymentYear: number;
    paymentMonth: number;
    contributionType: ContributionType;
    expectedAmount: number;
    paidAmount: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    receiptReference?: string;
    paymentDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
