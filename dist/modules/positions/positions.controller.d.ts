import { PositionsService, CreatePositionDto, UpdatePositionDto } from './positions.service';
export declare class PositionsController {
    private readonly positionsService;
    constructor(positionsService: PositionsService);
    create(createPositionDto: CreatePositionDto, req: any): Promise<import("../../entities/position-history.entity").PositionHistory>;
    findAll(page?: string, limit?: string, search?: string, level?: string, status?: string): Promise<{
        positions: import("../../entities/position-history.entity").PositionHistory[];
        total: number;
        page: number;
        limit: number;
    }>;
    getStats(): Promise<{
        totalPositions: number;
        activePositions: number;
        completedPositions: number;
        revokedPositions: number;
        positionsByLevel: Record<string, number>;
    }>;
    findByMember(memberId: string): Promise<import("../../entities/position-history.entity").PositionHistory[]>;
    findOne(id: string): Promise<import("../../entities/position-history.entity").PositionHistory>;
    update(id: string, updatePositionDto: UpdatePositionDto, req: any): Promise<import("../../entities/position-history.entity").PositionHistory>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
