import { Repository } from 'typeorm';
import { FileAttachment } from '../../entities/file-attachment.entity';
import { Member } from '../../entities/member.entity';
export declare class FilesService {
    private readonly fileAttachmentRepository;
    private readonly memberRepository;
    constructor(fileAttachmentRepository: Repository<FileAttachment>, memberRepository: Repository<Member>);
    uploadProfilePhoto(memberId: string, file: Express.Multer.File, uploadedBy: string): Promise<FileAttachment>;
    getProfilePhoto(memberId: string): Promise<FileAttachment | null>;
    getFileAttachment(id: string): Promise<FileAttachment>;
    deleteProfilePhoto(memberId: string, userId: string): Promise<void>;
    getMemberAttachments(memberId: string): Promise<FileAttachment[]>;
}
