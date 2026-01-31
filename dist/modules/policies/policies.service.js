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
exports.PoliciesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const client_s3_1 = require("@aws-sdk/client-s3");
const path = require("path");
const policy_document_entity_1 = require("../../entities/policy-document.entity");
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
let PoliciesService = class PoliciesService {
    policyRepository;
    s3Client;
    constructor(policyRepository) {
        this.policyRepository = policyRepository;
        this.s3Client = new client_s3_1.S3Client(S3_CONFIG);
    }
    async create(dto, userId) {
        const doc = this.policyRepository.create({
            ...dto,
            createdBy: userId,
        });
        return this.policyRepository.save(doc);
    }
    async findAll(page = 1, limit = 20, category) {
        const qb = this.policyRepository.createQueryBuilder('p').orderBy('p.createdAt', 'DESC');
        if (category) {
            qb.andWhere('p.category = :category', { category });
        }
        const [items, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const doc = await this.policyRepository.findOne({ where: { id } });
        if (!doc) {
            throw new common_1.NotFoundException('Policy document not found');
        }
        return doc;
    }
    async update(id, dto) {
        const doc = await this.findOne(id);
        Object.assign(doc, dto);
        return this.policyRepository.save(doc);
    }
    async remove(id) {
        const doc = await this.findOne(id);
        const urls = this.getAllFileUrls(doc);
        for (const url of urls) {
            try {
                const key = this.urlToKey(url);
                if (key)
                    await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
            }
            catch (e) {
            }
        }
        await this.policyRepository.remove(doc);
    }
    getAllFileUrls(doc) {
        if (doc.fileUrls?.length)
            return doc.fileUrls;
        if (doc.fileUrl)
            return [doc.fileUrl];
        return [];
    }
    async uploadFiles(policyId, files) {
        const doc = await this.findOne(policyId);
        const baseKey = `policies/${policyId}`;
        const endpoint = S3_CONFIG.endpoint.replace(/^https?:\/\//, '');
        const existing = this.getAllFileUrls(doc);
        const urls = [...existing];
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                throw new common_1.BadRequestException('Each file must be at most 10MB');
            }
            const ext = path.extname(file.originalname) || '';
            const key = `${baseKey}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype || 'application/octet-stream',
            }));
            urls.push(`http://${endpoint}/${BUCKET}/${key}`);
        }
        doc.fileUrls = urls;
        doc.fileUrl = urls[0] || undefined;
        return this.policyRepository.save(doc);
    }
    async removeFile(policyId, fileUrl) {
        const doc = await this.findOne(policyId);
        const urls = this.getAllFileUrls(doc);
        const idx = urls.indexOf(fileUrl);
        if (idx === -1)
            return doc;
        try {
            const key = this.urlToKey(fileUrl);
            if (key)
                await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        }
        catch (e) {
        }
        const updated = urls.filter((_, i) => i !== idx);
        doc.fileUrls = updated.length ? updated : undefined;
        doc.fileUrl = updated[0] || undefined;
        return this.policyRepository.save(doc);
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
exports.PoliciesService = PoliciesService;
exports.PoliciesService = PoliciesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(policy_document_entity_1.PolicyDocument)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PoliciesService);
//# sourceMappingURL=policies.service.js.map