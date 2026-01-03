import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Member, MembershipStatus, Gender, FamilyRelationship, MaritalStatus, Status } from '../../entities/member.entity';
import { EmploymentInfo, EmploymentStatus, SalaryRange } from '../../entities/employment-info.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';
import { FamiliesService } from '../families/families.service';
import * as fs from 'fs';
import * as path from 'path';

export interface CreateMemberDto {
  partyId: string;
  nationalId?: string;
  fullNameAmharic: string;
  fullNameEnglish: string;
  gender: Gender;
  dateOfBirth: Date;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  subCity: string;
  woreda: string;
  kebele: string;
  detailedAddress?: string;
  registrationDate: Date;
  notes?: string;
  educationalDocumentsFile?: string;
  experienceDocumentsFile?: string;
  familyId?: string;
  familyRelationship?: FamilyRelationship;
  contributionPercentage?: number;
  maritalStatus?: MaritalStatus;
  salaryAmount?: number;
  membershipStatus?: MembershipStatus;
  status?: Status;
}

export interface UpdateMemberDto {
  nationalId?: string;
  fullNameAmharic?: string;
  fullNameEnglish?: string;
  gender?: Gender;
  dateOfBirth?: Date;
  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  subCity?: string;
  woreda?: string;
  kebele?: string;
  detailedAddress?: string;
  membershipStatus?: MembershipStatus;
  notes?: string;
  educationalDocumentsFile?: string;
  experienceDocumentsFile?: string;
  familyId?: string;
  familyRelationship?: FamilyRelationship;
  contributionPercentage?: number;
  maritalStatus?: MaritalStatus;
  salaryAmount?: number;
  status?: Status;
}

export interface CreateEmploymentDto {
  employmentStatus: EmploymentStatus;
  organizationName?: string;
  jobTitle?: string;
  workSector?: string;
  monthlySalary?: number;
  salaryRange?: SalaryRange;
  additionalNotes?: string;
}

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(EmploymentInfo)
    private employmentRepository: Repository<EmploymentInfo>,
    private auditLogService: AuditLogService,
    private familiesService: FamiliesService,
  ) {}

  async create(createMemberDto: CreateMemberDto, userId: string, username: string): Promise<Member> {
    // Check if party ID already exists
    const existingMember = await this.memberRepository.findOne({
      where: { partyId: createMemberDto.partyId },
    });

    if (existingMember) {
      throw new ConflictException('Party ID already exists');
    }

    // Validate date of birth (must be at least 18 years old)
    const today = new Date();
    const birthDate = new Date(createMemberDto.dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      throw new BadRequestException('Member must be at least 18 years old');
    }

    // Validate family assignment if provided
    if (createMemberDto.familyId) {
      try {
        // Use findOne since familyId in member entity stores the UUID id, not the string familyId
        await this.familiesService.findOne(createMemberDto.familyId);
      } catch (error) {
        throw new BadRequestException('Invalid family ID provided');
      }
    }

    const member = this.memberRepository.create({
      ...createMemberDto,
      membershipStatus: MembershipStatus.SUPPORTIVE_MEMBER,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedMember = await this.memberRepository.save(member);

    // Update family member count if family is assigned
    if (createMemberDto.familyId) {
      await this.familiesService.updateMemberCount(createMemberDto.familyId);
    }

    // Log the creation
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.CREATE,
      entity: AuditEntity.MEMBER,
      entityId: savedMember.id,
      newValues: {
        partyId: savedMember.partyId,
        fullNameEnglish: savedMember.fullNameEnglish,
        familyId: savedMember.familyId
      },
      notes: 'Member registration',
    });

    return savedMember;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    membershipStatus?: MembershipStatus,
    status?: Status,
    gender?: Gender,
    subCity?: string,
    familyId?: string,
  ): Promise<{ members: Member[]; total: number; page: number; limit: number }> {
    const query = this.memberRepository.createQueryBuilder('member')
      .leftJoinAndSelect('member.employmentHistory', 'employment')
      .leftJoinAndSelect('member.positionHistory', 'positions')
      .leftJoinAndSelect('member.contributions', 'contributions');

    if (search) {
      query.andWhere(
        '(member.fullNameEnglish ILIKE :search OR member.fullNameAmharic ILIKE :search OR member.partyId ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (membershipStatus) {
      // Filter by membership status (Supportive Member, Candidate Member, Full Member)
      const normalizedMembershipStatus = typeof membershipStatus === 'string' ? membershipStatus.toLowerCase().trim() : membershipStatus;
      query.andWhere('member.membershipStatus = :membershipStatus', { membershipStatus: normalizedMembershipStatus });
      console.log('Filtering by membershipStatus:', normalizedMembershipStatus);
    }

    if (status) {
      // Filter by activity status (active, inactive, suspended)
      const normalizedStatus = typeof status === 'string' ? status.toLowerCase().trim() : status;
      query.andWhere('member.status = :status', { status: normalizedStatus });
      console.log('Filtering by status:', normalizedStatus);
    }

    if (gender) {
      // Handle both enum values and string values, normalize to lowercase
      // Gender enum values are 'male' and 'female' (lowercase)
      const normalizedGender = typeof gender === 'string' ? gender.toLowerCase().trim() : gender;
      query.andWhere('member.gender = :gender', { gender: normalizedGender });
      console.log('Filtering by gender:', normalizedGender, 'Type:', typeof gender, 'Original:', gender);
    }

    if (subCity) {
      query.andWhere('member.subCity = :subCity', { subCity });
    }

    if (familyId) {
      query.andWhere('member.familyId = :familyId', { familyId });
    }

    query.orderBy('member.createdAt', 'DESC');

    // Log the generated SQL query for debugging
    const sql = query.getQuery();
    const params = query.getParameters();
    console.log('Members query - SQL:', sql);
    console.log('Members query - Parameters:', JSON.stringify(params));
    console.log('Members query - Gender filter:', gender);

    const [members, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    console.log('Members query - Results:', { 
      membersCount: members.length, 
      total, 
      genderFilter: gender,
      sampleGenders: members.slice(0, 3).map(m => m.gender)
    });

    return { members, total, page, limit };
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: [
        'employmentHistory',
        'positionHistory',
        'contributions',
        'attachments',
      ],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto, userId: string, username: string): Promise<Member> {
    const member = await this.findOne(id);

    // Get old values for audit log
    const oldValues = {
      fullNameEnglish: member.fullNameEnglish,
      primaryPhone: member.primaryPhone,
      membershipStatus: member.membershipStatus,
      familyId: member.familyId,
    };

    // Handle empty string for familyId - convert to null to clear the relationship
    const shouldClearFamilyId = updateMemberDto.familyId === '';
    if (shouldClearFamilyId) {
      // Remove familyId from DTO to avoid assigning empty string
      delete updateMemberDto.familyId;
    }

    // Validate new family assignment if provided
    if (updateMemberDto.familyId) {
      try {
        // Use findOne since familyId in member entity stores the UUID id, not the string familyId
        await this.familiesService.findOne(updateMemberDto.familyId);
      } catch (error) {
        throw new BadRequestException('Invalid family ID provided');
      }
    }

    // Update member
    Object.assign(member, updateMemberDto);
    // Explicitly set familyId to null if it was an empty string (to clear the relationship)
    // TypeORM accepts null for nullable columns, so we use type assertion
    if (shouldClearFamilyId) {
      (member as any).familyId = null;
    }
    member.updatedBy = userId;

    const updatedMember = await this.memberRepository.save(member);

    // Update family member counts if family assignment changed
    const oldFamilyId = oldValues.familyId;
    const newFamilyId = updatedMember.familyId;

    if (oldFamilyId !== newFamilyId) {
      // Update old family count
      if (oldFamilyId) {
        await this.familiesService.updateMemberCount(oldFamilyId);
      }
      // Update new family count
      if (newFamilyId) {
        await this.familiesService.updateMemberCount(newFamilyId);
      }
    }

    // Log the update
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.UPDATE,
      entity: AuditEntity.MEMBER,
      entityId: id,
      oldValues,
      newValues: {
        fullNameEnglish: updatedMember.fullNameEnglish,
        primaryPhone: updatedMember.primaryPhone,
        membershipStatus: updatedMember.membershipStatus,
        familyId: updatedMember.familyId,
      },
      notes: 'Member profile update',
    });

    return updatedMember;
  }

  async createEmploymentInfo(memberId: string, employmentDto: CreateEmploymentDto, userId: string, username: string): Promise<EmploymentInfo> {
    const member = await this.findOne(memberId);

    // Create new employment record
    const employmentInfo = this.employmentRepository.create({
      ...employmentDto,
      memberId: member.id,
    });
    const saved = await this.employmentRepository.save(employmentInfo);

    // Log the creation
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.CREATE,
      entity: AuditEntity.MEMBER,
      entityId: memberId,
      newValues: {
        employmentStatus: saved.employmentStatus,
        organizationName: saved.organizationName,
      },
      notes: 'Employment information added',
    });

    return saved;
  }

  async updateEmploymentInfo(memberId: string, employmentId: string, employmentDto: CreateEmploymentDto, userId: string, username: string): Promise<EmploymentInfo> {
    const member = await this.findOne(memberId);

    const employmentInfo = await this.employmentRepository.findOne({
      where: { id: employmentId, memberId: member.id },
    });

    if (!employmentInfo) {
      throw new NotFoundException('Employment record not found');
    }

      const oldValues = {
        employmentStatus: employmentInfo.employmentStatus,
        organizationName: employmentInfo.organizationName,
        monthlySalary: employmentInfo.monthlySalary,
      };

      Object.assign(employmentInfo, employmentDto);
      const updated = await this.employmentRepository.save(employmentInfo);

      // Log the update
      await this.auditLogService.logAction({
        userId,
        username,
        action: AuditAction.UPDATE,
        entity: AuditEntity.MEMBER,
        entityId: memberId,
        oldValues,
        newValues: {
          employmentStatus: updated.employmentStatus,
          organizationName: updated.organizationName,
          monthlySalary: updated.monthlySalary,
        },
        notes: 'Employment information update',
      });

      return updated;
  }

  async deleteEmploymentInfo(memberId: string, employmentId: string, userId: string, username: string): Promise<void> {
    const member = await this.findOne(memberId);
    
    const employmentInfo = await this.employmentRepository.findOne({
      where: { id: employmentId, memberId: member.id },
    });

    if (!employmentInfo) {
      throw new NotFoundException('Employment record not found');
    }

    await this.employmentRepository.remove(employmentInfo);

    // Log the deletion
      await this.auditLogService.logAction({
        userId,
        username,
      action: AuditAction.DELETE,
        entity: AuditEntity.MEMBER,
        entityId: memberId,
      oldValues: {
        employmentStatus: employmentInfo.employmentStatus,
        organizationName: employmentInfo.organizationName,
        },
      notes: 'Employment information deleted',
      });
  }

  async getEmploymentHistory(memberId: string): Promise<EmploymentInfo[]> {
    const member = await this.findOne(memberId);
    return member.employmentHistory || [];
  }

  async getMemberStats(): Promise<{
    totalMembers: number;
    memberMembers: number;
    supportiveMembers: number;
    candidateMembers: number;
    totalMaleMembers: number;
    totalFemaleMembers: number;
    memberMaleMembers: number;
    memberFemaleMembers: number;
    supportiveMaleMembers: number;
    supportiveFemaleMembers: number;
    candidateMaleMembers: number;
    candidateFemaleMembers: number;
  }> {
    const stats = await this.memberRepository
      .createQueryBuilder('member')
      .select('member.membershipStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('member.membershipStatus')
      .getRawMany();

    // Get gender breakdown using direct entity queries (more reliable than raw queries)
    // Fetch all members with gender field
    const allMembers = await this.memberRepository.find({
      select: ['gender'],
    });

    const memberMembers = await this.memberRepository.find({
      select: ['gender'],
      where: {
        membershipStatus: MembershipStatus.MEMBER,
      }
    });

    const supportiveMembers = await this.memberRepository.find({
      select: ['gender'],
      where: {
        membershipStatus: MembershipStatus.SUPPORTIVE_MEMBER,
      }
    });

    const candidateMembers = await this.memberRepository.find({
      select: ['gender'],
      where: {
        membershipStatus: MembershipStatus.CANDIDATE,
      }
    });

    // Helper function to normalize gender for comparison
    const isMale = (gender: Gender | string | null | undefined): boolean => {
      if (!gender) return false;
      const normalized = typeof gender === 'string' ? gender.toLowerCase() : String(gender).toLowerCase();
      return normalized === 'male' || normalized === Gender.MALE;
    };

    const isFemale = (gender: Gender | string | null | undefined): boolean => {
      if (!gender) return false;
      const normalized = typeof gender === 'string' ? gender.toLowerCase() : String(gender).toLowerCase();
      return normalized === 'female' || normalized === Gender.FEMALE;
    };

    // Count genders using helper functions
    const totalMaleMembers = allMembers.filter(m => isMale(m.gender)).length;
    const totalFemaleMembers = allMembers.filter(m => isFemale(m.gender)).length;

    const memberMaleMembers = memberMembers.filter(m => isMale(m.gender)).length;
    const memberFemaleMembers = memberMembers.filter(m => isFemale(m.gender)).length;

    const supportiveMaleMembers = supportiveMembers.filter(m => isMale(m.gender)).length;
    const supportiveFemaleMembers = supportiveMembers.filter(m => isFemale(m.gender)).length;

    const candidateMaleMembers = candidateMembers.filter(m => isMale(m.gender)).length;
    const candidateFemaleMembers = candidateMembers.filter(m => isFemale(m.gender)).length;

    console.log('Gender counts - All members:', allMembers.length);
    console.log('Gender counts - Total Male:', totalMaleMembers, 'Total Female:', totalFemaleMembers);
    console.log('Gender counts - Member Male:', memberMaleMembers, 'Member Female:', memberFemaleMembers);
    console.log('Gender counts - Supportive Male:', supportiveMaleMembers, 'Supportive Female:', supportiveFemaleMembers);
    console.log('Gender counts - Candidate Male:', candidateMaleMembers, 'Candidate Female:', candidateFemaleMembers);

    const result = {
      totalMembers: 0,
      memberMembers: 0,
      supportiveMembers: 0,
      candidateMembers: 0,
      totalMaleMembers: 0,
      totalFemaleMembers: 0,
      memberMaleMembers: 0,
      memberFemaleMembers: 0,
      supportiveMaleMembers: 0,
      supportiveFemaleMembers: 0,
      candidateMaleMembers: 0,
      candidateFemaleMembers: 0,
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      result.totalMembers += count;

      switch (stat.status) {
        case MembershipStatus.MEMBER:
          result.memberMembers = count;
          break;
        case MembershipStatus.SUPPORTIVE_MEMBER:
          result.supportiveMembers = count;
          break;
        case MembershipStatus.CANDIDATE:
          result.candidateMembers = count;
          break;
      }
    });

    // Assign gender counts directly
    result.totalMaleMembers = totalMaleMembers;
    result.totalFemaleMembers = totalFemaleMembers;
    result.memberMaleMembers = memberMaleMembers;
    result.memberFemaleMembers = memberFemaleMembers;
    result.supportiveMaleMembers = supportiveMaleMembers;
    result.supportiveFemaleMembers = supportiveFemaleMembers;
    result.candidateMaleMembers = candidateMaleMembers;
    result.candidateFemaleMembers = candidateFemaleMembers;

    console.log('Final result:', JSON.stringify(result, null, 2));

    return result;
  }

  async uploadEducationalDocuments(
    memberId: string,
    file: Express.Multer.File,
    userId: string,
    username: string,
  ) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Validate file type (only PDF for educational documents)
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed for educational documents');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 10MB');
    }

    const bucketName = 'prosperityparty';

    // Delete existing educational document from MinIO if it exists
    if (member.educationalDocumentsFile) {
      try {
        // Extract filename from existing URL
        const urlParts = member.educationalDocumentsFile.split('/');
        const existingFilename = urlParts[urlParts.length - 1];

        const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
          credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          },
          forcePathStyle: true,
        });

        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: `educational-documents/${existingFilename}`,
        });

        await s3Client.send(deleteCommand);
        console.log(`Deleted old educational document from MinIO: educational-documents/${existingFilename}`);
      } catch (error) {
        console.error('Error deleting old educational document from MinIO:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload file to MinIO
    const timestamp = Date.now();
    const filename = `educational-${memberId}-${timestamp}.pdf`;

    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: `educational-documents/${filename}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await s3Client.send(uploadCommand);

    // Update member with file path
    const minioUrl = `https://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost:9000'}/${bucketName}/educational-documents/${filename}`;
    await this.memberRepository.update(memberId, {
      educationalDocumentsFile: minioUrl,
      updatedBy: userId,
    });

    // Log the action
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.UPDATE,
      entity: AuditEntity.MEMBER,
      entityId: memberId,
      notes: `Uploaded educational documents: ${file.originalname}`,
    });

    return {
      message: 'Educational documents uploaded successfully',
      filename: filename,
      originalFilename: file.originalname,
      fileSize: file.size,
    };
  }

  async uploadExperienceDocuments(
    memberId: string,
    file: Express.Multer.File,
    userId: string,
    username: string,
  ) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Validate file type
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

    const bucketName = 'prosperityparty';

    // Delete existing experience document from MinIO if it exists
    if (member.experienceDocumentsFile) {
      try {
        // Extract filename from existing URL
        const urlParts = member.experienceDocumentsFile.split('/');
        const existingFilename = urlParts[urlParts.length - 1];

        const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
          credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          },
          forcePathStyle: true,
        });

        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: `experience-documents/${existingFilename}`,
        });

        await s3Client.send(deleteCommand);
        console.log(`Deleted old experience document from MinIO: experience-documents/${existingFilename}`);
      } catch (error) {
        console.error('Error deleting old experience document from MinIO:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload file to MinIO
    const timestamp = Date.now();
    const fileExtension = require('path').extname(file.originalname);
    const filename = `experience-${memberId}-${timestamp}${fileExtension}`;

    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: `experience-documents/${filename}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await s3Client.send(uploadCommand);

    // Update member with file path
    const minioUrl = `https://${process.env.MINIO_ENDPOINT?.replace('http://', '').replace('https://', '') || 'localhost:9000'}/${bucketName}/experience-documents/${filename}`;
    await this.memberRepository.update(memberId, {
      experienceDocumentsFile: minioUrl,
      updatedBy: userId,
    });

    // Log the action
    await this.auditLogService.logAction({
      userId,
      username,
      action: AuditAction.UPDATE,
      entity: AuditEntity.MEMBER,
      entityId: memberId,
      notes: `Uploaded experience documents: ${file.originalname}`,
    });

    return {
      message: 'Experience documents uploaded successfully',
      filename: filename,
      originalFilename: file.originalname,
      fileSize: file.size,
    };
  }

  async getEducationalDocuments(memberId: string) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member || !member.educationalDocumentsFile) {
      return null;
    }

    return {
      filePath: member.educationalDocumentsFile,
      mimeType: 'application/pdf',
      originalFilename: `educational-documents-${memberId}.pdf`,
    };
  }

  async downloadEducationalDocuments(memberId: string): Promise<Buffer | null> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member || !member.educationalDocumentsFile) {
      return null;
    }

    // Extract filename from the MinIO URL
    const urlParts = member.educationalDocumentsFile.split('/');
    const filename = urlParts[urlParts.length - 1];

    const bucketName = 'prosperityparty';
    const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });

    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: `educational-documents/${filename}`,
      });

      const response = await s3Client.send(getCommand);
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
      console.error('Error downloading educational documents from MinIO:', error);
      return null;
    }
  }

  async getExperienceDocuments(memberId: string) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member || !member.experienceDocumentsFile) {
      return null;
    }

    // Extract file extension from the URL
    const urlParts = member.experienceDocumentsFile.split('.');
    const fileExtension = urlParts[urlParts.length - 1].toLowerCase();
    let mimeType = 'application/octet-stream';

    switch (fileExtension) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'doc':
        mimeType = 'application/msword';
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
    }

    return {
      filePath: member.experienceDocumentsFile,
      mimeType,
      originalFilename: `experience-documents-${memberId}.${fileExtension}`,
    };
  }

  async downloadExperienceDocuments(memberId: string): Promise<Buffer | null> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member || !member.experienceDocumentsFile) {
      return null;
    }

    // Extract filename from the MinIO URL
    const urlParts = member.experienceDocumentsFile.split('/');
    const filename = urlParts[urlParts.length - 1];

    const bucketName = 'prosperityparty';
    const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });

    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: `experience-documents/${filename}`,
      });

      const response = await s3Client.send(getCommand);
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
      console.error('Error downloading experience documents from MinIO:', error);
      return null;
    }
  }

  async deleteEducationalDocuments(
    memberId: string,
    userId: string,
    username: string,
  ) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.educationalDocumentsFile) {
      // Extract filename from URL for MinIO deletion
      const urlParts = member.educationalDocumentsFile.split('/');
      const filename = urlParts[urlParts.length - 1];

      // Delete file from MinIO
      try {
        const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
          credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          },
          forcePathStyle: true,
        });

        const deleteCommand = new DeleteObjectCommand({
          Bucket: 'prosperityparty',
          Key: `educational-documents/${filename}`,
        });
        await s3Client.send(deleteCommand);
      } catch (error) {
        console.error('Error deleting educational document from MinIO:', error);
        // Continue with database update even if MinIO delete fails
      }

      // Update member record - clear the field by setting to null in database
      await this.memberRepository.update(memberId, {
        educationalDocumentsFile: null as any, // Type assertion to bypass TypeScript
        updatedBy: userId,
      });

      // Log the action
      await this.auditLogService.logAction({
        userId,
        username,
        action: AuditAction.DELETE,
        entity: AuditEntity.MEMBER,
        entityId: memberId,
        notes: 'Deleted educational documents',
      });
    }

    return { message: 'Educational documents deleted successfully' };
  }

  async deleteExperienceDocuments(
    memberId: string,
    userId: string,
    username: string,
  ) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.experienceDocumentsFile) {
      // Extract filename from URL for MinIO deletion
      const urlParts = member.experienceDocumentsFile.split('/');
      const filename = urlParts[urlParts.length - 1];

      // Delete file from MinIO
      try {
        const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
          credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          },
          forcePathStyle: true,
        });

        const deleteCommand = new DeleteObjectCommand({
          Bucket: 'prosperityparty',
          Key: `experience-documents/${filename}`,
        });
        await s3Client.send(deleteCommand);
      } catch (error) {
        console.error('Error deleting experience document from MinIO:', error);
        // Continue with database update even if MinIO delete fails
      }

      // Update member record - clear the field by setting to null in database
      await this.memberRepository.update(memberId, {
        experienceDocumentsFile: null as any, // Type assertion to bypass TypeScript
        updatedBy: userId,
      });

      // Log the action
      await this.auditLogService.logAction({
        userId,
        username,
        action: AuditAction.DELETE,
        entity: AuditEntity.MEMBER,
        entityId: memberId,
        notes: 'Deleted experience documents',
      });
    }

    return { message: 'Experience documents deleted successfully' };
  }

  async getFilteredMembers(filters: any) {
    const queryBuilder = this.memberRepository.createQueryBuilder('member')
      .leftJoinAndSelect('member.employmentHistory', 'employment')
      .leftJoinAndSelect('member.positionHistory', 'position');

    if (filters.membershipStatusFilter && filters.membershipStatusFilter !== '') {
      queryBuilder.andWhere('member.membershipStatus = :membershipStatus', {
        membershipStatus: filters.membershipStatusFilter
      });
    }

    if (filters.activityStatusFilter && filters.activityStatusFilter !== '') {
      queryBuilder.andWhere('member.status = :status', {
        status: filters.activityStatusFilter
      });
    }

    if (filters.genderFilter && filters.genderFilter !== '') {
      queryBuilder.andWhere('member.gender = :gender', {
        gender: filters.genderFilter
      });
    }

    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      queryBuilder.andWhere(
        '(member.fullNameEnglish LIKE :search OR member.fullNameAmharic LIKE :search OR member.partyId LIKE :search OR member.primaryPhone LIKE :search)',
        { search: `%${filters.searchQuery}%` }
      );
    }

    queryBuilder.orderBy('member.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async generateMembersPDF(members: any[]): Promise<Buffer> {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Members Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .header-info { margin-bottom: 20px; }
            .status-active { color: #059669; }
            .status-inactive { color: #dc2626; }
            .status-suspended { color: #d97706; }
          </style>
        </head>
        <body>
          <h1>Members Report</h1>
          <div class="header-info">
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total Members:</strong> ${members.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Party ID</th>
                <th>Full Name (English)</th>
                <th>Full Name (Amharic)</th>
                <th>Gender</th>
                <th>Membership Status</th>
                <th>Activity Status</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              ${members.map(member => `
                <tr>
                  <td>${member.partyId}</td>
                  <td>${member.fullNameEnglish}</td>
                  <td>${member.fullNameAmharic || ''}</td>
                  <td>${member.gender || ''}</td>
                  <td>${member.membershipStatus || ''}</td>
                  <td class="status-${member.status || ''}">${member.status || ''}</td>
                  <td>${member.primaryPhone || ''}</td>
                  <td>${member.email || ''}</td>
                  <td>${member.registrationDate ? new Date(member.registrationDate).toLocaleDateString() : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();
    return pdfBuffer;
  }

  async generateMembersExcel(members: any[]): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Members Report');

    // Add title
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Members Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Add report info
    worksheet.getCell('A3').value = 'Report Date:';
    worksheet.getCell('B3').value = new Date().toLocaleDateString();
    worksheet.getCell('A4').value = 'Total Members:';
    worksheet.getCell('B4').value = members.length;

    // Add headers
    const headers = [
      'Party ID',
      'Full Name (English)',
      'Full Name (Amharic)',
      'Gender',
      'Membership Status',
      'Activity Status',
      'Phone',
      'Email',
      'Registration Date'
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(6, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data
    members.forEach((member, rowIndex) => {
      const row = 7 + rowIndex;
      worksheet.getCell(row, 1).value = member.partyId;
      worksheet.getCell(row, 2).value = member.fullNameEnglish;
      worksheet.getCell(row, 3).value = member.fullNameAmharic || '';
      worksheet.getCell(row, 4).value = member.gender || '';
      worksheet.getCell(row, 5).value = member.membershipStatus || '';
      worksheet.getCell(row, 6).value = member.status || '';
      worksheet.getCell(row, 7).value = member.primaryPhone || '';
      worksheet.getCell(row, 8).value = member.email || '';
      worksheet.getCell(row, 9).value = member.registrationDate
        ? new Date(member.registrationDate).toLocaleDateString()
        : '';

      // Add borders to data cells
      for (let col = 1; col <= 9; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }
}
