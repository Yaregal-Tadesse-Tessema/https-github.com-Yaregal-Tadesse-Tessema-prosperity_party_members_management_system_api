"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const client_s3_1 = require("@aws-sdk/client-s3");
const path = require("path");
const news_entity_1 = require("../../entities/news.entity");
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
let NewsService = class NewsService {
    newsRepository;
    s3Client;
    constructor(newsRepository) {
        this.newsRepository = newsRepository;
        this.s3Client = new client_s3_1.S3Client(S3_CONFIG);
    }
    async create(dto, userId) {
        const news = this.newsRepository.create({
            ...dto,
            createdBy: userId,
        });
        return this.newsRepository.save(news);
    }
    async findAll(page = 1, limit = 20) {
        const [items, total] = await this.newsRepository.findAndCount({
            order: { publishedAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async findOne(id) {
        const news = await this.newsRepository.findOne({ where: { id } });
        if (!news) {
            throw new common_1.NotFoundException('News not found');
        }
        return news;
    }
    async update(id, dto) {
        const news = await this.findOne(id);
        Object.assign(news, dto);
        return this.newsRepository.save(news);
    }
    async remove(id) {
        const news = await this.findOne(id);
        if (news.imageUrls?.length) {
            for (const url of news.imageUrls) {
                try {
                    const key = this.urlToKey(url);
                    if (key)
                        await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
                }
                catch (e) {
                }
            }
        }
        await this.newsRepository.remove(news);
    }
    async uploadImages(newsId, files) {
        const news = await this.findOne(newsId);
        const baseKey = `news/${newsId}`;
        const endpoint = S3_CONFIG.endpoint.replace(/^https?:\/\//, '');
        const urls = [...(news.imageUrls || [])];
        for (const file of files) {
            if (!file.mimetype?.startsWith('image/')) {
                throw new common_1.BadRequestException('Only image files are allowed');
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new common_1.BadRequestException('Each image must be at most 5MB');
            }
            const ext = path.extname(file.originalname) || '.jpg';
            const key = `${baseKey}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            urls.push(`http://${endpoint}/${BUCKET}/${key}`);
        }
        news.imageUrls = urls;
        return this.newsRepository.save(news);
    }
    async removeImage(newsId, imageUrl) {
        const news = await this.findOne(newsId);
        const urls = news.imageUrls || [];
        const idx = urls.indexOf(imageUrl);
        if (idx === -1)
            return news;
        try {
            const key = this.urlToKey(imageUrl);
            if (key)
                await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        }
        catch (e) {
        }
        news.imageUrls = urls.filter((_, i) => i !== idx);
        return this.newsRepository.save(news);
    }
    urlToKey(url) {
        try {
            const u = new URL(url);
            const pathname = u.pathname.slice(1);
            const bucketPrefix = BUCKET + '/';
            if (pathname.startsWith(bucketPrefix))
                return pathname.slice(bucketPrefix.length);
            return pathname;
        }
        catch {
            return null;
        }
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(news_entity_1.News)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NewsService);
//# sourceMappingURL=news.service.js.map