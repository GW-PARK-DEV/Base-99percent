import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { BunjangProduct } from './dto/bunjang-search.dto';

@Injectable()
export class BunjangSearchService {
  private readonly apiUrl = 'https://api.bunjang.co.kr/api/1/find_v2.json';

  async search(query: string, page = 0, order = 'score'): Promise<BunjangProduct[]> {
    const response = await axios.get(this.apiUrl, {
      params: { q: query, order, page },
    });

    return (response.data.list || []).map((item: any) => ({
      name: item.name,
      price: item.price,
      used: item.used === 2 ? '새 상품' : item.used === 1 ? '사용감 있음' : '알 수 없음',
      free_shipping: item.free_shipping,
      tag: item.tag,
    }));
  }
}

