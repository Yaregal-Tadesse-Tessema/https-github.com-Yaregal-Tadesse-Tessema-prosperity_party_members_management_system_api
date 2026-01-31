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
    uploadFiles(id: string, uploaded: {
        files?: Express.Multer.File[];
    }, req: any): Promise<import("../../entities/policy-document.entity").PolicyDocument>;
    removeFile(id: string, url: string, req: any): Promise<import("../../entities/policy-document.entity").PolicyDocument>;
    findOne(id: string): Promise<import("../../entities/policy-document.entity").PolicyDocument>;
    update(id: string, dto: UpdatePolicyDto, req: any): Promise<import("../../entities/policy-document.entity").PolicyDocument>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    private requireAdmin;
}
