import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Member } from './member.entity';

export enum FileType {
  PROFILE_PHOTO = 'profile_photo',
  ID_DOCUMENT = 'id_document',
  CERTIFICATE = 'certificate',
  EDUCATIONAL_DOCUMENTS = 'educational_documents',
  EXPERIENCE_DOCUMENTS = 'experience_documents',
  EMPLOYMENT_LETTER = 'employment_letter',
  OTHER = 'other',
}

@Entity('file_attachments')
export class FileAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => Member, member => member.attachments)
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column()
  filename: string;

  @Column()
  originalFilename: string;

  @Column()
  mimeType: string;

  @Column()
  filePath: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({
    type: 'varchar',
    default: FileType.OTHER,
  })
  fileType: FileType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  uploadedBy?: string; // User ID
}
