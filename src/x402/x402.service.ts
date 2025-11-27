import { Injectable, Logger } from '@nestjs/common';
import { useFacilitator } from 'x402/verify';
import { processPriceToAtomicAmount, findMatchingPaymentRequirements, toJsonSafe } from 'x402/shared';
import * as schemes from 'x402/schemes';
import { SupportedEVMNetworks } from 'x402/types';
import { getAddress } from 'viem';
import type { X402RouteConfig, X402ModuleOptions } from './interfaces/x402-config.interface';

@Injectable()
export class X402Service {
  private readonly logger = new Logger(X402Service.name);
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
      this.logger.log(`=== verifyPayment 시작 ===`);
      this.logger.log(`paymentHeader: ${paymentHeader.substring(0, 100)}...`);
      
      const req = this.createPaymentRequirements(resourceUrl, method, config);
      if (!req) {
        this.logger.error(`createPaymentRequirements가 null 반환`);
        return false;
      }

      const decoded = schemes.exact.evm.decodePayment(paymentHeader);
      this.logger.log(`decoded payment: ${JSON.stringify(decoded)}`);
      
      decoded.x402Version = 1;
      const matched = findMatchingPaymentRequirements([req], decoded);
      this.logger.log(`matched: ${matched ? 'found' : 'not found'}`);
      
      if (!matched) {
        this.logger.error(`매칭되는 payment requirements 없음`);
        this.logger.log(`req: ${JSON.stringify(req)}`);
        return false;
      }
      
      const verifyResult = await this.verify(decoded, matched);
      this.logger.log(`verify 결과: ${JSON.stringify(verifyResult)}`);
      
      return verifyResult.isValid;
    } catch (error) {
      this.logger.error(`verifyPayment 에러: ${error?.message}`);
      this.logger.error(`에러 전체: ${JSON.stringify(error)}`);
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
    this.logger.log(`=== createPaymentRequirements 시작 ===`);
    this.logger.log(`resourceUrl: ${resourceUrl}`);
    this.logger.log(`method: ${method}`);
    this.logger.log(`config: ${JSON.stringify(config)}`);
    
    const network = config.network as typeof SupportedEVMNetworks[number];
    this.logger.log(`network: ${network}`);
    this.logger.log(`SupportedEVMNetworks: ${JSON.stringify(SupportedEVMNetworks)}`);
    
    if (!SupportedEVMNetworks.includes(network)) {
      this.logger.error(`지원하지 않는 네트워크: ${network}`);
      return null;
    }

    const result = processPriceToAtomicAmount(config.price, network);
    this.logger.log(`processPriceToAtomicAmount 결과: ${JSON.stringify(result)}`);
    
    if ('error' in result) {
      this.logger.error(`가격 처리 에러: ${result.error}`);
      return null;
    }
    
    if (!('eip712' in result.asset)) {
      this.logger.error(`eip712가 없음`);
      return null;
    }

    const requirements = {
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
    
    this.logger.log(`생성된 requirements: ${JSON.stringify(requirements)}`);
    return requirements;
  }
}