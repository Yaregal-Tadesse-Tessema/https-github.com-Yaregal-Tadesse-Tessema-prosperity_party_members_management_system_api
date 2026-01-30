import { Repository } from 'typeorm';
import { News } from '../../entities/news.entity';
export interface CreateNewsDto {
    title: string;
    body?: string;
    publishedAt: Date;
    author?: string;
    attachmentUrl?: string;
}
export interface UpdateNewsDto {
    title?: string;
    body?: string;
    publishedAt?: Date;
    author?: string;
    attachmentUrl?: string;
}
export declare class NewsService {
    private newsRepository;
    constructor(newsRepository: Repository<News>);
    create(dto: CreateNewsDto, userId: string): Promise<News>;
    findAll(page?: number, limit?: number): Promise<{
        items: News[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<News>;
    update(id: string, dto: UpdateNewsDto): Promise<News>;
    remove(id: string): Promise<void>;
}
