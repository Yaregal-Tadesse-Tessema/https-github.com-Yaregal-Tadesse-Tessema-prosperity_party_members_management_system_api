import { EventsService, CreateEventDto, UpdateEventDto } from './events.service';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    create(dto: CreateEventDto, req: any): Promise<import("../../entities/event.entity").Event>;
    findAll(page?: string, limit?: string): Promise<{
        items: import("../../entities/event.entity").Event[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("../../entities/event.entity").Event>;
    update(id: string, dto: UpdateEventDto, req: any): Promise<import("../../entities/event.entity").Event>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    private requireAdmin;
}
