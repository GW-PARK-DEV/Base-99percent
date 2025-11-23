import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Base64Service } from './base64.service';
import { FileUploadDto } from './dto/base64.dto';

@ApiTags('base64')
@Controller('base64')
export class Base64Controller {
  constructor(private readonly base64Service: Base64Service) {}

  @Post('encode/file')
  @ApiOperation({ summary: '파일을 Base64로 변환' })
  @ApiResponse({ status: 201, description: 'Base64 변환 성공' })
  @ApiResponse({ status: 400, description: '파일이 없거나 유효하지 않음' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '업로드할 파일',
    type: FileUploadDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  encodeFromFile(@UploadedFile() file: Express.Multer.File): { base64: string } {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    const base64 = this.base64Service.encodeFromFile(file);
    return { base64 };
  }
}
