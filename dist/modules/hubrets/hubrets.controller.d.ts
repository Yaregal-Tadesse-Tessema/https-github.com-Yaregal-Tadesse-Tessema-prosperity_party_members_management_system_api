import { HubretsService, CreateHubretDto, UpdateHubretDto } from './hubrets.service';
export declare class HubretsController {
    private readonly hubretsService;
    constructor(hubretsService: HubretsService);
    create(createHubretDto: CreateHubretDto, req: any): Promise<import("../../entities/hubret.entity").Hubret>;
    findAll(): Promise<import("../../entities/hubret.entity").Hubret[]>;
    getStats(): Promise<{
        totalHubrets: number;
        activeHubrets: number;
        totalFamilies: number;
        totalMembers: number;
    }>;
    findOne(id: string): Promise<import("../../entities/hubret.entity").Hubret>;
    update(id: string, updateHubretDto: UpdateHubretDto, req: any): Promise<import("../../entities/hubret.entity").Hubret>;
    remove(id: string, req: any): Promise<void>;
    checkFamilyAssignment(hubretId: string, familyId: string): Promise<{
        canAssign: boolean;
        currentHubret?: {
            id: string;
            name: string;
        };
        message: string;
    }>;
    assignFamilyToHubret(hubretId: string, familyId: string, req: any): Promise<import("../../entities/family.entity").Family>;
    removeFamilyFromHubret(hubretId: string, familyId: string, req: any): Promise<import("../../entities/family.entity").Family>;
}
