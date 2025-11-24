import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION')!,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }

  async generateUploadUrl(bucket: string, key: string, contentType: string): Promise<{ uploadUrl: string }> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    return { uploadUrl };
  }

  async generateDownloadUrl(bucket: string, key: string): Promise<{ downloadUrl: string }> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    return { downloadUrl };
  }

  async uploadFile(bucket: string, key: string, file: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });
    await this.s3Client.send(command);
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await this.s3Client.send(command);
  }
  
  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`파일을 찾을 수 없습니다: ${key}`);
    }
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async downloadFileFromS3Path(s3Path: string): Promise<Express.Multer.File> {
    const [, bucket, ...keyParts] = s3Path.split('/');
    const key = keyParts.join('/');
    const filename = keyParts[keyParts.length - 1];
    const buffer = await this.downloadFile(bucket, key);

    return {
      buffer,
      mimetype: 'image/jpeg',
      originalname: filename,
      fieldname: 'images',
      encoding: '7bit',
      size: buffer.length,
    } as Express.Multer.File;
  }
}