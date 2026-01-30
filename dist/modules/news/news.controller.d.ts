import { NewsService, CreateNewsDto, UpdateNewsDto } from './news.service';
export declare class NewsController {
    private readonly newsService;
    constructor(newsService: NewsService);
    create(dto: CreateNewsDto, req: any): Promise<import("../../entities/news.entity").News>;
    findAll(page?: string, limit?: string): Promise<{
        items: import("../../entities/news.entity").News[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("../../entities/news.entity").News>;
    update(id: string, dto: UpdateNewsDto, req: any): Promise<import("../../entities/news.entity").News>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    private requireAdmin;
}
