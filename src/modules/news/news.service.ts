import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
  ) {}

  async create(dto: CreateNewsDto, userId: string): Promise<News> {
    const news = this.newsRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.newsRepository.save(news);
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ items: News[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.newsRepository.findAndCount({
      order: { publishedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<News> {
    const news = await this.newsRepository.findOne({ where: { id } });
    if (!news) {
      throw new NotFoundException('News not found');
    }
    return news;
  }

  async update(id: string, dto: UpdateNewsDto): Promise<News> {
    const news = await this.findOne(id);
    Object.assign(news, dto);
    return this.newsRepository.save(news);
  }

  async remove(id: string): Promise<void> {
    const news = await this.findOne(id);
    await this.newsRepository.remove(news);
  }
}
