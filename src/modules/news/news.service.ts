import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { News } from '../../entities/news.entity';

export interface CreateNewsDto {
  title: string;
  body?: string;
  publishedAt: Date;
  author?: string;
  attachmentUrl?: string;
  imageUrls?: string[];
}

export interface UpdateNewsDto {
  title?: string;
  body?: string;
  publishedAt?: Date;
  author?: string;
  attachmentUrl?: string;
  imageUrls?: string[];
}

const BUCKET = 'prosperityparty';
const S3_CONFIG = {
  region: 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT || 'http://196.189.124.228:9000',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'AY1WUU308IX79DRABRGI',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'neZmzgNaQpigqGext6G+HG6HM3Le7nXv3vhBNpaq',
  },
  forcePathStyle: true,
};

@Injectable()
export class NewsService {
  private s3Client: S3Client;

  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
  ) {
    this.s3Client = new S3Client(S3_CONFIG);
  }

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
    if (news.imageUrls?.length) {
      for (const url of news.imageUrls) {
        try {
          const key = this.urlToKey(url);
          if (key) await this.s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        } catch (e) {
          // ignore
        }
      }
    }
    await this.newsRepository.remove(news);
  }

  async uploadImages(newsId: string, files: Express.Multer.File[]): Promise<News> {
    const news = await this.findOne(newsId);
    const baseKey = `news/${newsId}`;
    const endpoint = (S3_CONFIG.endpoint as string).replace(/^https?:\/\//, '');
    const urls: string[] = [...(news.imageUrls || [])];
    for (const file of files) {
      if (!file.mimetype?.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Each image must be at most 5MB');
      }
      const ext = path.extname(file.originalname) || '.jpg';
      const key = `${baseKey}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      urls.push(`http://${endpoint}/${BUCKET}/${key}`);
    }
    news.imageUrls = urls;
    return this.newsRepository.save(news);
  }

  async removeImage(newsId: string, imageUrl: string): Promise<News> {
    const news = await this.findOne(newsId);
    const urls = news.imageUrls || [];
    const idx = urls.indexOf(imageUrl);
    if (idx === -1) return news;
    try {
      const key = this.urlToKey(imageUrl);
      if (key) await this.s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (e) {
      // ignore
    }
    news.imageUrls = urls.filter((_, i) => i !== idx);
    return this.newsRepository.save(news);
  }

  private urlToKey(url: string): string | null {
    try {
      const u = new URL(url);
      const pathname = u.pathname.slice(1);
      const bucketPrefix = BUCKET + '/';
      if (pathname.startsWith(bucketPrefix)) return pathname.slice(bucketPrefix.length);
      return pathname;
    } catch {
      return null;
    }
  }
}
