import { Controller, Post, Delete, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { S3Service } from './s3.service';
import { UploadUrlDto } from './dto/upload-url.dto';
import { DownloadUrlDto } from './dto/download-url.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { DeleteFileDto } from './dto/delete-file.dto';

@ApiTags('s3')
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload-url')
  @ApiOperation({ summary: '업로드 URL 생성' })
  @ApiBody({ type: UploadUrlDto })
  async generateUploadUrl(@Body() dto: UploadUrlDto) {
    return this.s3Service.generateUploadUrl(dto.bucket, dto.key, dto.contentType);
  }

  @Post('download-url')
  @ApiOperation({ summary: '다운로드 URL 생성' })
  @ApiBody({ type: DownloadUrlDto })
  async generateDownloadUrl(@Body() dto: DownloadUrlDto) {
    return this.s3Service.generateDownloadUrl(dto.bucket, dto.key);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        bucket: { type: 'string', example: 'product-analysis' },
        key: { type: 'string', example: 'profile_image/profile.jpg' },
      },
      required: ['file', 'bucket', 'key'],
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadFileDto) {
    if (!file) {
      throw new Error('파일이 필요합니다.');
    }
    await this.s3Service.uploadFile(dto.bucket, dto.key, file.buffer, file.mimetype);
  }

  @Delete()
  @ApiOperation({ summary: '파일 삭제' })
  @ApiBody({ type: DeleteFileDto })
  async deleteFile(@Body() dto: DeleteFileDto) {
    await this.s3Service.deleteFile(dto.bucket, dto.key);
  }
}
