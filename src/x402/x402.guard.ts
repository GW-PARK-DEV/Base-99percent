import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { X402_PAYMENT_KEY } from './decorators/require-payment.decorator';
import { X402RouteConfig } from './interfaces/x402-config.interface';
import { X402Service } from './x402.service';

@Injectable()
export class X402Guard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private x402Service: X402Service,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const paymentConfig = this.reflector.get<X402RouteConfig>(
      X402_PAYMENT_KEY,
      context.getHandler(),
    );

    if (!paymentConfig) {
      return true;
    }

    const paymentHeader = request.headers['x-payment'] as string;
    const instructions = this.x402Service.getPaymentInstructions(
      request.url,
      request.method,
      paymentConfig,
    );

    if (!paymentHeader) {
      response.status(HttpStatus.PAYMENT_REQUIRED).json(instructions);
      return false;
    }

    const isValid = await this.x402Service.verifyPayment(
      paymentHeader,
      request.url,
      request.method,
      paymentConfig,
    );

    if (!isValid) {
      response.status(HttpStatus.PAYMENT_REQUIRED).json(instructions);
      return false;
    }

    return true;
  }
}

