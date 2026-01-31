import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { PolicyDocument } from '../../entities/policy-document.entity';

export interface CreatePolicyDto {
  title: string;
  description?: string;
  fileUrl?: string;
  fileUrls?: string[];
  category?: string;
}

export interface UpdatePolicyDto {
  title?: string;
  description?: string;
  fileUrl?: string;
  fileUrls?: string[];
  category?: string;
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
export class PoliciesService {
  private s3Client: S3Client;

  constructor(
    @InjectRepository(PolicyDocument)
    private policyRepository: Repository<PolicyDocument>,
  ) {
    this.s3Client = new S3Client(S3_CONFIG);
  }

  async create(dto: CreatePolicyDto, userId: string): Promise<PolicyDocument> {
    const doc = this.policyRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.policyRepository.save(doc);
  }

  async findAll(page: number = 1, limit: number = 20, category?: string): Promise<{ items: PolicyDocument[]; total: number; page: number; limit: number }> {
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

  async findOne(id: string): Promise<PolicyDocument> {
    const doc = await this.policyRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Policy document not found');
    }
    return doc;
  }

  async update(id: string, dto: UpdatePolicyDto): Promise<PolicyDocument> {
    const doc = await this.findOne(id);
    Object.assign(doc, dto);
    return this.policyRepository.save(doc);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.findOne(id);
    const urls = this.getAllFileUrls(doc);
    for (const url of urls) {
      try {
        const key = this.urlToKey(url);
        if (key) await this.s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      } catch (e) {
        // ignore
      }
    }
    await this.policyRepository.remove(doc);
  }

  getAllFileUrls(doc: PolicyDocument): string[] {
    if (doc.fileUrls?.length) return doc.fileUrls;
    if (doc.fileUrl) return [doc.fileUrl];
    return [];
  }

  async uploadFiles(policyId: string, files: Express.Multer.File[]): Promise<PolicyDocument> {
    const doc = await this.findOne(policyId);
    const baseKey = `policies/${policyId}`;
    const endpoint = (S3_CONFIG.endpoint as string).replace(/^https?:\/\//, '');
    const existing = this.getAllFileUrls(doc);
    const urls: string[] = [...existing];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Each file must be at most 10MB');
      }
      const ext = path.extname(file.originalname) || '';
      const key = `${baseKey}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || 'application/octet-stream',
        }),
      );
      urls.push(`http://${endpoint}/${BUCKET}/${key}`);
    }
    doc.fileUrls = urls;
    doc.fileUrl = urls[0] || undefined;
    return this.policyRepository.save(doc);
  }

  async removeFile(policyId: string, fileUrl: string): Promise<PolicyDocument> {
    const doc = await this.findOne(policyId);
    const urls = this.getAllFileUrls(doc);
    const idx = urls.indexOf(fileUrl);
    if (idx === -1) return doc;
    try {
      const key = this.urlToKey(fileUrl);
      if (key) await this.s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (e) {
      // ignore
    }
    const updated = urls.filter((_, i) => i !== idx);
    doc.fileUrls = updated.length ? updated : undefined;
    doc.fileUrl = updated[0] || undefined;
    return this.policyRepository.save(doc);
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
