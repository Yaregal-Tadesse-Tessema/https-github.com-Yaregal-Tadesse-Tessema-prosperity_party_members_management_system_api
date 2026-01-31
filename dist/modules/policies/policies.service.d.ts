import { Repository } from 'typeorm';
import { PolicyDocument } from '../../entities/policy-document.entity';
export interface CreatePolicyDto {
    title: string;
    description?: string;
    fileUrl?: string;
    fileUrls?: string[];
    category?: string;
}
export interface UpdatePolicyDto {
    title?: string;
    description?: string;
    fileUrl?: string;
    fileUrls?: string[];
    category?: string;
}
export declare class PoliciesService {
    private policyRepository;
    private s3Client;
    constructor(policyRepository: Repository<PolicyDocument>);
    create(dto: CreatePolicyDto, userId: string): Promise<PolicyDocument>;
    findAll(page?: number, limit?: number, category?: string): Promise<{
        items: PolicyDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<PolicyDocument>;
    update(id: string, dto: UpdatePolicyDto): Promise<PolicyDocument>;
    remove(id: string): Promise<void>;
    getAllFileUrls(doc: PolicyDocument): string[];
    uploadFiles(policyId: string, files: Express.Multer.File[]): Promise<PolicyDocument>;
    removeFile(policyId: string, fileUrl: string): Promise<PolicyDocument>;
    private urlToKey;
}
