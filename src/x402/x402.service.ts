import { Injectable } from '@nestjs/common';
import type { X402RouteConfig, X402ModuleOptions } from './interfaces/x402-config.interface';
import { useFacilitator } from 'x402/verify';
import { processPriceToAtomicAmount, findMatchingPaymentRequirements, toJsonSafe } from 'x402/shared';
import * as schemes from 'x402/schemes';
import { SupportedEVMNetworks } from 'x402/types';
import { getAddress } from 'viem';

@Injectable()
export class X402Service {
  private verify: any;
  private x402Version = 1;

  constructor(options: X402ModuleOptions) {
    const facilitator = useFacilitator(
      options.facilitatorUrl
        ? ({ url: options.facilitatorUrl } as { url: `${string}://${string}` })
        : undefined,
    );
    this.verify = facilitator.verify;
  }

  /** 결제 검증 */
  async verifyPayment(
    paymentHeader: string,
    resourceUrl: string,
    method: string,
    config: X402RouteConfig,
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const requirements = this.createPaymentRequirements(resourceUrl, method, config);
      if (!requirements) {
        return { isValid: false, error: '결제 Requirements 생성 실패' };
      }

      const decoded = schemes.exact.evm.decodePayment(paymentHeader);
      decoded.x402Version = this.x402Version;

      const matched = findMatchingPaymentRequirements([requirements], decoded);
      if (!matched) {
        return { isValid: false, error: '일치하는 결제 Requirements가 없습니다' };
      }

      const result = await this.verify(decoded, matched);
      return {
        isValid: result.isValid,
        error: result.isValid ? undefined : result.invalidReason,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '결제 검증 실패',
      };
    }
  }

  /** 결제 Requirements 응답 생성 */
  getPaymentInstructions(resourceUrl: string, method: string, config: X402RouteConfig) {
    const requirements = this.createPaymentRequirements(resourceUrl, method, config);
    return {
      x402Version: this.x402Version,
      error: 'X-PAYMENT 헤더가 필요합니다',
      accepts: requirements ? toJsonSafe([requirements]) : [],
    };
  }

  /** 결제 Requirements 생성 */
  private createPaymentRequirements(
    resourceUrl: string,
    method: string,
    config: X402RouteConfig,
  ) {
    const amount = processPriceToAtomicAmount(config.price, config.network as any);
    if ('error' in amount) return null;

    const { maxAmountRequired, asset } = amount;
    const isValidNetwork = SupportedEVMNetworks.includes(config.network as any);
    const hasEip712 = 'eip712' in asset;

    if (!isValidNetwork || !hasEip712) return null;

    return {
      scheme: 'exact' as const,
      network: config.network as any,
      maxAmountRequired,
      resource: resourceUrl,
      description: config.description ?? '',
      mimeType: config.mimeType ?? '',
      payTo: getAddress(config.recipientAddress),
      maxTimeoutSeconds: config.maxTimeoutSeconds ?? 60,
      asset: getAddress(asset.address as `0x${string}`),
      outputSchema: {
        input: { type: 'http', method: method.toUpperCase(), discoverable: true },
        output: config.outputSchema,
      },
      extra: asset.eip712,
    };
  }
}