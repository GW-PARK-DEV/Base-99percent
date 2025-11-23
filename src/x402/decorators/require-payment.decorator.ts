import { SetMetadata } from '@nestjs/common';
import { X402RouteConfig } from '../interfaces/x402-config.interface';

export const X402_PAYMENT_KEY = 'x402_payment';

/** 결제가 필요한 엔드포인트에 사용하는 데코레이터 */
export const RequirePayment = (config: X402RouteConfig) =>
  SetMetadata(X402_PAYMENT_KEY, config);