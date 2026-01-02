import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileAttachment, FileType } from '../../entities/file-attachment.entity';
import { Member } from '../../entities/member.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileAttachment)
    private readonly fileAttachmentRepository: Repository<FileAttachment>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

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

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `profile-${memberId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Deactivate existing profile photos for this member
    await this.fileAttachmentRepository.update(
      {
        memberId,
        fileType: FileType.PROFILE_PHOTO,
        isActive: true,
      },
      { isActive: false },
    );

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Create file attachment record
    const fileAttachment = this.fileAttachmentRepository.create({
      memberId,
      filename,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      filePath,
      fileSize: file.size,
      fileType: FileType.PROFILE_PHOTO,
      uploadedBy,
    });

    return this.fileAttachmentRepository.save(fileAttachment);
  }

  async getProfilePhoto(memberId: string): Promise<FileAttachment | null> {
    return this.fileAttachmentRepository.findOne({
      where: {
        memberId,
        fileType: FileType.PROFILE_PHOTO,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
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

    // Delete file from disk
    if (fs.existsSync(fileAttachment.filePath)) {
      fs.unlinkSync(fileAttachment.filePath);
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
}
