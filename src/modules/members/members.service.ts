import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Member, MembershipStatus, Gender, FamilyRelationship, MaritalStatus, Status } from '../../entities/member.entity';
import { EmploymentInfo, EmploymentStatus, SalaryRange } from '../../entities/employment-info.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntity } from '../../entities/audit-log.entity';
import { FamiliesService } from '../families/families.service';

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
}
