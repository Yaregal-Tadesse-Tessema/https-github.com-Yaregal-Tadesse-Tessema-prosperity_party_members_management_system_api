import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileAttachment, FileType } from '../../entities/file-attachment.entity';
import { Member } from '../../entities/member.entity';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';

@Injectable()
export class FilesService {
  private s3Client: S3Client;

  constructor(
    @InjectRepository(FileAttachment)
    private readonly fileAttachmentRepository: Repository<FileAttachment>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async uploadProfilePhoto(
    memberId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<FileAttachment> {
    // Verify member exists
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `profile-${memberId}-${Date.now()}${fileExtension}`;
    const bucketName = 'prosperityparty';

    // Find and delete existing active profile photo from MinIO
    const existingPhoto = await this.fileAttachmentRepository.findOne({
      where: {
        memberId,
        fileType: FileType.PROFILE_PHOTO,
        isActive: true,
      },
    });

    if (existingPhoto) {
      // Delete the old file from MinIO
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: `profile/${existingPhoto.filename}`,
        });
        await this.s3Client.send(deleteCommand);
        console.log(`Deleted old profile photo from MinIO: profile/${existingPhoto.filename}`);
      } catch (error) {
        console.error('Error deleting old profile photo from MinIO:', error);
        // Continue with upload even if deletion fails
      }

      // Deactivate the existing photo record
      await this.fileAttachmentRepository.update(existingPhoto.id, { isActive: false });
    }

    // Upload file to MinIO
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: `profile/${filename}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make file publicly accessible
    });

    await this.s3Client.send(uploadCommand);

    // Create file attachment record
    const fileAttachment = this.fileAttachmentRepository.create({
      memberId,
      filename,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      filePath: `https://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost:9000'}/${bucketName}/profile/${filename}`,
      fileSize: file.size,
      fileType: FileType.PROFILE_PHOTO,
      uploadedBy,
    });

    return this.fileAttachmentRepository.save(fileAttachment);
  }

  async getProfilePhoto(memberId: string): Promise<FileAttachment | null> {
    const fileAttachment = await this.fileAttachmentRepository.findOne({
      where: {
        memberId,
        fileType: FileType.PROFILE_PHOTO,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });

    if (fileAttachment) {
      // Generate signed URL for private access (if needed)
      const getCommand = new GetObjectCommand({
        Bucket: 'prosperityparty',
        Key: `profile/${fileAttachment.filename}`,
      });

      try {
        const signedUrl = await getSignedUrl(this.s3Client, getCommand, { expiresIn: 3600 }); // 1 hour expiry
        fileAttachment.filePath = signedUrl;
      } catch (error) {
        console.error('Error generating signed URL:', error);
        // Fallback to public URL if signed URL fails
        fileAttachment.filePath = `https://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost:9000'}/prosperityparty/profile/${fileAttachment.filename}`;
      }
    }

    return fileAttachment;
  }

  async getFileAttachment(id: string): Promise<FileAttachment> {
    const file = await this.fileAttachmentRepository.findOne({
      where: { id, isActive: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async downloadProfilePhoto(memberId: string): Promise<Buffer | null> {
    const fileAttachment = await this.fileAttachmentRepository.findOne({
      where: {
        memberId,
        fileType: FileType.PROFILE_PHOTO,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });

    if (!fileAttachment) {
      return null;
    }

    try {
      const getCommand = new GetObjectCommand({
        Bucket: 'prosperityparty',
        Key: `profile/${fileAttachment.filename}`,
      });

      const response = await this.s3Client.send(getCommand);
      const chunks: Uint8Array[] = [];

      if (response.Body) {
        const stream = response.Body as any;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      }

      return null;
    } catch (error) {
      console.error('Error downloading profile photo from MinIO:', error);
      return null;
    }
  }

  async deleteProfilePhoto(memberId: string, userId: string): Promise<void> {
    const fileAttachment = await this.fileAttachmentRepository.findOne({
      where: {
        memberId,
        fileType: FileType.PROFILE_PHOTO,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });

    if (!fileAttachment) {
      throw new NotFoundException('Profile photo not found');
    }

    // Delete file from MinIO
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: 'prosperityparty',
        Key: `profile/${fileAttachment.filename}`,
      });
      await this.s3Client.send(deleteCommand);
    } catch (error) {
      console.error('Error deleting file from MinIO:', error);
      // Continue with database update even if MinIO delete fails
    }

    // Mark as inactive (updatedAt will be automatically set by TypeORM)
    await this.fileAttachmentRepository.update(fileAttachment.id, {
      isActive: false,
    });
  }

  async getMemberAttachments(memberId: string): Promise<FileAttachment[]> {
    return this.fileAttachmentRepository.find({
      where: {
        memberId,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async uploadDocument(
    memberId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<FileAttachment> {
    // Verify member exists
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Validate file type (allow PDF, DOC, DOCX, JPG, PNG)
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed. Only PDF, DOC, DOCX, JPG, and PNG files are accepted.');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 10MB');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `doc-${memberId}-${timestamp}${fileExtension}`;
    const bucketName = 'prosperityparty';

    // Upload file to MinIO
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: `documents/${filename}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make file publicly accessible
    });

    await this.s3Client.send(uploadCommand);

    // Determine file type based on request body or filename
    let fileType = FileType.OTHER;
    const originalFilename = file.originalname.toLowerCase();

    if (originalFilename.includes('education') || originalFilename.includes('certificate') || file.mimetype === 'application/pdf') {
      fileType = FileType.EDUCATIONAL_DOCUMENTS;
    } else if (originalFilename.includes('experience') || originalFilename.includes('work')) {
      fileType = FileType.EXPERIENCE_DOCUMENTS;
    } else if (originalFilename.includes('employment') || originalFilename.includes('letter') || originalFilename.includes('contract')) {
      fileType = FileType.EMPLOYMENT_LETTER;
    }

    // Create file attachment record
    const fileAttachment = this.fileAttachmentRepository.create({
      memberId,
      filename,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      filePath: `https://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost:9000'}/${bucketName}/documents/${filename}`,
      fileSize: file.size,
      fileType,
      uploadedBy,
      description: `Document uploaded for member ${member.fullNameEnglish}`,
    });

    return this.fileAttachmentRepository.save(fileAttachment);
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const fileAttachment = await this.fileAttachmentRepository.findOne({
      where: { id, isActive: true },
    });

    if (!fileAttachment) {
      throw new NotFoundException('File not found');
    }

    // Delete file from MinIO
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: 'prosperityparty',
        Key: `documents/${fileAttachment.filename}`,
      });
      await this.s3Client.send(deleteCommand);
    } catch (error) {
      console.error('Error deleting file from MinIO:', error);
      // Continue with database update even if MinIO delete fails
    }

    // Mark as inactive
    await this.fileAttachmentRepository.update(id, {
      isActive: false,
    });
  }
}
