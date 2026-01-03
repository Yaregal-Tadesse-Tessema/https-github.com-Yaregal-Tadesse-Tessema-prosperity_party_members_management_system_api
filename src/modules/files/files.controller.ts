import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Response,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response as ExpressResponse } from 'express';
import * as fs from 'fs';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('members/:memberId/profile-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadProfilePhoto(
    @Param('memberId') memberId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    return this.filesService.uploadProfilePhoto(memberId, file, req.user.id);
  }

  @Get('members/:memberId/profile-photo')
  async getProfilePhoto(
    @Param('memberId') memberId: string,
    @Response() res: ExpressResponse,
  ) {
    const fileAttachment = await this.filesService.getProfilePhoto(memberId);

    if (!fileAttachment) {
      return res.status(404).json({ message: 'Profile photo not found' });
    }

    // Download file from MinIO
    const fileBuffer = await this.filesService.downloadProfilePhoto(memberId);

    if (!fileBuffer) {
      return res.status(404).json({ message: 'Profile photo not found in storage' });
    }

    res.setHeader('Content-Type', fileAttachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileAttachment.originalFilename}"`);
    res.send(fileBuffer);
  }

  @Delete('members/:memberId/profile-photo')
  async deleteProfilePhoto(
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    await this.filesService.deleteProfilePhoto(memberId, req.user.id);
    return { message: 'Profile photo deleted successfully' };
  }

  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    await this.filesService.deleteFile(id, req.user.id);
    return { message: 'File deleted successfully' };
  }

  @Post('members/:memberId/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('memberId') memberId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    this.checkPermission(req.user, ['system_admin', 'party_admin', 'data_entry_officer']);
    return this.filesService.uploadDocument(memberId, file, req.user.id);
  }

  @Get('members/:memberId/attachments')
  async getMemberAttachments(@Param('memberId') memberId: string) {
    return this.filesService.getMemberAttachments(memberId);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const fileAttachment = await this.filesService.getFileAttachment(id);

    if (!fs.existsSync(fileAttachment.filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    res.setHeader('Content-Type', fileAttachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileAttachment.originalFilename}"`);

    const fileStream = fs.createReadStream(fileAttachment.filePath);
    fileStream.pipe(res);
  }

  private checkPermission(user: any, allowedRoles: string[]) {
    if (!this.hasRole(user, allowedRoles)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private hasRole(user: any, roles: string[]): boolean {
    return roles.includes(user.role);
  }
}




