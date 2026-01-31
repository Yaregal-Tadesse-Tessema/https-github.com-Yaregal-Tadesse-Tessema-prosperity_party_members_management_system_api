import { FamiliesService, CreateFamilyDto, UpdateFamilyDto } from './families.service';
export declare class FamiliesController {
    private readonly familiesService;
    constructor(familiesService: FamiliesService);
    private checkPermission;
    private hasRole;
    create(createFamilyDto: CreateFamilyDto, req: any): Promise<import("../../entities/family.entity").Family>;
    findAll(req: any, page?: string, limit?: string, search?: string, status?: string, hubretId?: string): Promise<{
        families: import("../../entities/family.entity").Family[];
        total: number;
        page: number;
        limit: number;
    }>;
    getStats(): Promise<{
        totalFamilies: number;
        activeFamilies: number;
        nuclearFamilies: number;
        extendedFamilies: number;
        totalMaleMembers: number;
        totalFemaleMembers: number;
        activeMaleMembers: number;
        activeFemaleMembers: number;
        inactiveMaleMembers: number;
        inactiveFemaleMembers: number;
    }>;
    recomputeMemberCounts(req: any): Promise<{
        updated: number;
    }>;
    findOne(id: string): Promise<import("../../entities/family.entity").Family>;
    findByFamilyId(familyId: string): Promise<import("../../entities/family.entity").Family>;
    update(id: string, updateFamilyDto: UpdateFamilyDto, req: any): Promise<import("../../entities/family.entity").Family>;
    remove(id: string, req: any): Promise<void>;
}
