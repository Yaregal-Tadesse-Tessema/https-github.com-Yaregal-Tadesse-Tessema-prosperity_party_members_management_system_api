import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { PositionHistory } from './position-history.entity';
import { Contribution } from './contribution.entity';
import { EmploymentInfo } from './employment-info.entity';
import { FileAttachment } from './file-attachment.entity';
import { Family } from './family.entity';

export enum MembershipStatus {
  CANDIDATE = 'candidate',
  SUPPORTIVE_MEMBER = 'supportive_member',
  MEMBER = 'member',
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum EducationLevel {
  NONE = 'none',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DIPLOMA = 'diploma',
  BACHELOR = 'bachelor',
  MASTERS = 'masters',
  PHD = 'phd',
  OTHER = 'other'
}

export enum WorkSector {
  PRIVATE = 'private',
  GOVERNMENT = 'government',
  NGO = 'ngo',
  SELF_EMPLOYED = 'self_employed',
  OTHER = 'other'
}

export enum FamilyRelationship {
  HEAD = 'head',
  SPOUSE = 'spouse',
  CHILD = 'child',
  PARENT = 'parent',
  SIBLING = 'sibling',
  GRANDPARENT = 'grandparent',
  GRANDCHILD = 'grandchild',
  OTHER = 'other'
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated'
}

// Leadership and Work Experience are now stored as number of years

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  partyId: string;

  @Column({ nullable: true, unique: true })
  nationalId?: string;

  // Personal Information
  @Column()
  fullNameAmharic: string;

  @Column()
  fullNameEnglish: string;

  @Column({
    type: 'varchar',
  })
  gender: Gender;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ nullable: true })
  ethnicOrigin?: string;

  // Birth place information
  @Column({ nullable: true })
  birthState?: string;

  @Column({ nullable: true })
  birthZone?: string;

  @Column({ nullable: true })
  birthCity?: string;

  @Column({ nullable: true })
  birthKebele?: string;

  @Column()
  primaryPhone: string;

  @Column({ nullable: true })
  secondaryPhone?: string;

  @Column({ nullable: true })
  email?: string;

  // Education Information
  @Column({
    type: 'varchar',
    nullable: true
  })
  educationLevel?: EducationLevel;

  @Column({ nullable: true })
  educationFieldOfStudy?: string;

  // Languages (stored as JSON array)
  @Column({ type: 'json', nullable: true })
  languagesSpoken?: string[];

  // Experience and Leadership (in years)
  @Column({ type: 'int', nullable: true, default: 0 })
  leadershipExperience?: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  workExperience?: number;

  @Column({ nullable: true })
  partyResponsibility?: string;

  // Political and Work History
  @Column({ type: 'boolean', default: false })
  previouslyPoliticalPartyMember: boolean;

  @Column({
    type: 'varchar',
    nullable: true
  })
  workSector?: WorkSector;

  // Address Information
  @Column()
  subCity: string;

  @Column()
  woreda: string;

  @Column()
  kebele: string;

  @Column({ type: 'text', nullable: true })
  detailedAddress?: string;

  @Column({
    type: 'varchar',
    default: MembershipStatus.SUPPORTIVE_MEMBER,
  })
  membershipStatus: MembershipStatus;

  @Column({
    type: 'varchar',
    default: Status.ACTIVE,
  })
  status: Status;

  @Column({ type: 'date' })
  registrationDate: Date;

  @Column({ nullable: true })
  notes?: string;

  // File Attachments
  @Column({ nullable: true })
  educationalDocumentsFile?: string; // File path/name for educational documents PDF

  @Column({ nullable: true })
  experienceDocumentsFile?: string; // File path/name for experience documents

  // Family Information
  @Column({ nullable: true })
  familyId?: string;

  @ManyToOne(() => Family, family => family.members, { nullable: true })
  @JoinColumn({ name: 'familyId' })
  family?: Family;

  @Column({
    type: 'varchar',
    nullable: true
  })
  familyRelationship?: FamilyRelationship;

  // Contribution and Marital Status
  @Column({
    type: 'varchar',
    nullable: true
  })
  maritalStatus?: MaritalStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salaryAmount?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 1.0 })
  contributionPercentage?: number;

  // Relationships
  @OneToMany(() => EmploymentInfo, employment => employment.member, { cascade: true })
  employmentHistory?: EmploymentInfo[];

  @OneToMany(() => PositionHistory, position => position.member, { cascade: true })
  positionHistory: PositionHistory[];

  @OneToMany(() => Contribution, contribution => contribution.member, { cascade: true })
  contributions: Contribution[];

  @OneToMany(() => FileAttachment, attachment => attachment.member, { cascade: true })
  attachments: FileAttachment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy?: string; // User ID

  @Column({ nullable: true })
  updatedBy?: string; // User ID
}
