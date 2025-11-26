import { Injectable } from '@nestjs/common';
import { useFacilitator } from 'x402/verify';
import { processPriceToAtomicAmount, findMatchingPaymentRequirements, toJsonSafe } from 'x402/shared';
import * as schemes from 'x402/schemes';
import { SupportedEVMNetworks } from 'x402/types';
import { getAddress } from 'viem';
import type { X402RouteConfig, X402ModuleOptions } from './interfaces/x402-config.interface';

@Injectable()
export class X402Service {
  private readonly verify: ReturnType<typeof useFacilitator>['verify'];

  constructor(options: X402ModuleOptions) {
    this.verify = useFacilitator(
      options.facilitatorUrl ? { url: options.facilitatorUrl as `${string}://${string}` } : undefined
    ).verify;
  }

  async verifyPayment(
    paymentHeader: string,
    resourceUrl: string,
    method: string,
    config: X402RouteConfig,
  ): Promise<boolean> {
    try {
      const req = this.createPaymentRequirements(resourceUrl, method, config);
      if (!req) return false;

      const decoded = schemes.exact.evm.decodePayment(paymentHeader);
      decoded.x402Version = 1;
      const matched = findMatchingPaymentRequirements([req], decoded);
      return matched ? (await this.verify(decoded, matched)).isValid : false;
    } catch {
      return false;
    }
  }

  getPaymentInstructions(resourceUrl: string, method: string, config: X402RouteConfig) {
    const req = this.createPaymentRequirements(resourceUrl, method, config);
    return {
      x402Version: 1,
      error: '결제 필요',
      accepts: req ? toJsonSafe([req]) : [],
    };
  }

  private createPaymentRequirements(resourceUrl: string, method: string, config: X402RouteConfig) {
    const network = config.network as typeof SupportedEVMNetworks[number];
    if (!SupportedEVMNetworks.includes(network)) return null;

    const result = processPriceToAtomicAmount(config.price, network);
    if ('error' in result || !('eip712' in result.asset)) return null;

    return {
      scheme: 'exact' as const,
      network,
      maxAmountRequired: result.maxAmountRequired,
      resource: resourceUrl,
      description: config.description!,
      mimeType: config.mimeType ?? 'application/json',
      payTo: getAddress(config.recipientAddress),
      maxTimeoutSeconds: config.maxTimeoutSeconds ?? 60,
      asset: getAddress(result.asset.address as `0x${string}`),
      outputSchema: {
        input: { type: 'http', method: method.toUpperCase(), discoverable: true },
        output: config.outputSchema,
      },
      extra: result.asset.eip712,
    };
  }
}