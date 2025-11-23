import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

/** JSON 파일 읽기 및 파싱 서비스 */
@Injectable()
export class JsonService {
  /** JSON 파일 읽기 및 파싱 */
  read<T = any>(filePath: string): T {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  }

  /** 디렉토리 경로와 파일명으로 JSON 파일 읽기 */
  readFromDir<T = any>(dirPath: string, filename: string): T {
    return this.read<T>(join(dirPath, filename));
  }

  /** 텍스트를 JSON으로 파싱 */
  parse<T = any>(text: string): T {
    return JSON.parse(text) as T;
  }
}

