import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UploadUrlDto {
  @ApiProperty({ example: 'product-analysis' })
  @IsString()
  @IsNotEmpty()
  bucket: string;

  @ApiProperty({ example: 'profile_image/profile.jpg' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  contentType: string;
}