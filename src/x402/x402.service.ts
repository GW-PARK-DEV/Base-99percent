import { Injectable } from '@nestjs/common';
import { useFacilitator } from 'x402/verify';
import {
  processPriceToAtomicAmount,
  findMatchingPaymentRequirements,
  toJsonSafe,
} from 'x402/shared';
import * as schemes from 'x402/schemes';
import { SupportedEVMNetworks } from 'x402/types';
import { getAddress, isAddress } from 'viem';
import type { X402RouteConfig, X402ModuleOptions } from './interfaces/x402-config.interface';

@Injectable()
export class X402Service {
  private readonly verify: ReturnType<typeof useFacilitator>['verify'];
  private readonly x402Version = 1;

  constructor(options: X402ModuleOptions) {
    const facilitatorConfig = options.facilitatorUrl
      ? { url: options.facilitatorUrl as `${string}://${string}` }
      : undefined;
    this.verify = useFacilitator(facilitatorConfig).verify;
  }

  async verifyPayment(
    paymentHeader: string,
    resourceUrl: string,
    method: string,
    config: X402RouteConfig,
  ): Promise<boolean> {
    try {
      const requirements = this.createPaymentRequirements(resourceUrl, method, config);
      if (!requirements) return false;

      const decoded = this.decodePaymentHeader(paymentHeader);
      const matched = findMatchingPaymentRequirements([requirements], decoded);
      if (!matched) return false;

      return (await this.verify(decoded, matched)).isValid;
    } catch {
      return false;
    }
  }

  extractWalletAddress(paymentHeader: string): string | undefined {
    try {
      const decoded = this.decodePaymentHeader(paymentHeader) as any;
      const fromAddress =
        decoded._from || decoded.payload?._from || decoded.payload?.authorization?.from;

      if (!fromAddress || !isAddress(fromAddress)) return undefined;
      return getAddress(fromAddress);
    } catch {
      return undefined;
    }
  }

  getPaymentInstructions(resourceUrl: string, method: string, config: X402RouteConfig) {
    const requirements = this.createPaymentRequirements(resourceUrl, method, config);
    return {
      x402Version: this.x402Version,
      error: '결제 필요',
      accepts: requirements ? toJsonSafe([requirements]) : [],
    };
  }

  private decodePaymentHeader(paymentHeader: string) {
    const decoded = schemes.exact.evm.decodePayment(paymentHeader);
    decoded.x402Version = this.x402Version;
    return decoded;
  }

  private createPaymentRequirements(
    resourceUrl: string,
    method: string,
    config: X402RouteConfig,
  ) {
    const network = config.network as typeof SupportedEVMNetworks[number];
    if (!SupportedEVMNetworks.includes(network)) return null;

    const amountResult = processPriceToAtomicAmount(config.price, network);
    if ('error' in amountResult || !('eip712' in amountResult.asset)) return null;

    const { maxAmountRequired, asset } = amountResult;

    return {
      scheme: 'exact' as const,
      network,
      maxAmountRequired,
      resource: resourceUrl,
      description: config.description!,
      mimeType: config.mimeType ?? 'application/json',
      payTo: getAddress(config.recipientAddress),
      maxTimeoutSeconds: config.maxTimeoutSeconds ?? 60,
      asset: getAddress(asset.address as `0x${string}`),
      outputSchema: {
        input: {
          type: 'http',
          method: method.toUpperCase(),
          discoverable: true,
        },
        output: config.outputSchema,
      },
      extra: asset.eip712,
    };
  }
}