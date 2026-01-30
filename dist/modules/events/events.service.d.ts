import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';
export interface CreateEventDto {
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
    imageUrl?: string;
}
export interface UpdateEventDto {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    imageUrl?: string;
}
export declare class EventsService {
    private eventRepository;
    constructor(eventRepository: Repository<Event>);
    create(dto: CreateEventDto, userId: string): Promise<Event>;
    findAll(page?: number, limit?: number): Promise<{
        items: Event[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Event>;
    update(id: string, dto: UpdateEventDto): Promise<Event>;
    remove(id: string): Promise<void>;
}
