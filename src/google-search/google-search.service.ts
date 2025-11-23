import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SearchOptions, SearchResponse } from './interfaces/image-search.interface';

/** Google Custom Search API를 사용하여 검색을 수행하는 서비스 */
@Injectable()
export class GoogleSearchService {
  private readonly apiUrl = 'https://www.googleapis.com/customsearch/v1';
  private readonly apiKey: string;
  private readonly searchEngineId: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_API_KEY') || '';
    this.searchEngineId = this.configService.get<string>('GOOGLE_SEARCH_ENGINE_ID') || '';

    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('GOOGLE_API_KEY와 GOOGLE_SEARCH_ENGINE_ID 환경 변수가 필요합니다.');
    }
  }

  /** 일반 웹 검색 수행 */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const response = await axios.get(this.apiUrl, {
      params: {
        key: this.apiKey,
        cx: this.searchEngineId,
        q: options.query,
        num: options.num || 10,
        start: options.start || 1,
        safe: 'medium',
      },
    });

    const data = response.data as {
      items?: Array<{
        title: string;
        link: string;
        snippet: string;
        displayLink?: string;
      }>;
      searchInformation?: { totalResults?: string };
    };

    const items = data.items?.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
    })) || [];

    return {
      items,
      totalResults: parseInt(data.searchInformation?.totalResults || '0'),
      currentPage: Math.floor(((options.start || 1) - 1) / (options.num || 10)) + 1,
    };
  }
}
