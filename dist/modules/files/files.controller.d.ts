import { FilesService } from './files.service';
import { Response as ExpressResponse } from 'express';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    uploadProfilePhoto(memberId: string, file: Express.Multer.File, req: any): Promise<import("../../entities/file-attachment.entity").FileAttachment>;
    getProfilePhoto(memberId: string, res: ExpressResponse): Promise<ExpressResponse<any, Record<string, any>> | undefined>;
    deleteProfilePhoto(memberId: string, req: any): Promise<{
        message: string;
    }>;
    getMemberAttachments(memberId: string): Promise<import("../../entities/file-attachment.entity").FileAttachment[]>;
    downloadFile(id: string, res: ExpressResponse): Promise<ExpressResponse<any, Record<string, any>> | undefined>;
    private checkPermission;
    private hasRole;
}
