import { PoliciesService, CreatePolicyDto, UpdatePolicyDto } from './policies.service';
export declare class PoliciesController {
    private readonly policiesService;
    constructor(policiesService: PoliciesService);
    create(dto: CreatePolicyDto, req: any): Promise<import("../../entities/policy-document.entity").PolicyDocument>;
    findAll(page?: string, limit?: string, category?: string): Promise<{
        items: import("../../entities/policy-document.entity").PolicyDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("../../entities/policy-document.entity").PolicyDocument>;
    update(id: string, dto: UpdatePolicyDto, req: any): Promise<import("../../entities/policy-document.entity").PolicyDocument>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    private requireAdmin;
}
