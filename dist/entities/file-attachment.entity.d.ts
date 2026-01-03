import { Member } from './member.entity';
export declare enum FileType {
    PROFILE_PHOTO = "profile_photo",
    ID_DOCUMENT = "id_document",
    CERTIFICATE = "certificate",
    EDUCATIONAL_DOCUMENTS = "educational_documents",
    EXPERIENCE_DOCUMENTS = "experience_documents",
    EMPLOYMENT_LETTER = "employment_letter",
    OTHER = "other"
}
export declare class FileAttachment {
    id: string;
    memberId: string;
    member: Member;
    filename: string;
    originalFilename: string;
    mimeType: string;
    filePath: string;
    fileSize: number;
    fileType: FileType;
    isActive: boolean;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    uploadedBy?: string;
}
