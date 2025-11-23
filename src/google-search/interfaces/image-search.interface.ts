/** 검색 요청 옵션 */
export interface SearchOptions {
  query: string;
  num?: number;
  start?: number;
}

/** 검색 결과 항목 */
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

/** 검색 응답 */
export interface SearchResponse {
  items: SearchResult[];
  totalResults: number;
  currentPage: number;
}

