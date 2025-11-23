import { Injectable } from '@nestjs/common';

@Injectable()
export class Base64Service {
  /**
   * Buffer를 Base64 문자열로 변환
   * @param buffer 변환할 Buffer
   * @returns Base64 인코딩된 문자열
   */
  encodeFromBuffer(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  /**
   * 파일을 Base64 문자열로 변환
   * @param file Multer 파일 객체
   * @returns Base64 인코딩된 문자열
   */
  encodeFromFile(file: Express.Multer.File): string {
    return this.encodeFromBuffer(file.buffer);
  }

  /**
   * Base64 문자열을 Buffer로 변환
   * @param base64 Base64 인코딩된 문자열
   * @returns 변환된 Buffer
   */
  decodeToBuffer(base64: string): Buffer {
    return Buffer.from(base64, 'base64');
  }

  /**
   * Base64 문자열 유효성 검증
   * @param base64 검증할 Base64 문자열
   * @returns 유효한 Base64인지 여부
   */
  isValidBase64(base64: string): boolean {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(base64);
  }
}
