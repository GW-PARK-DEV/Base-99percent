import { DynamicModule, Global, Module } from '@nestjs/common';
import { X402Service } from './x402.service';
import { X402Guard } from './x402.guard';
import { X402ModuleOptions } from './interfaces/x402-config.interface';

@Global()
@Module({})
export class X402Module {
  static forRoot(options: X402ModuleOptions): DynamicModule {
    return {
      module: X402Module,
      providers: [
        {
          provide: X402Service,
          useFactory: () => new X402Service(options),
        },
        X402Guard,
      ],
      exports: [X402Service, X402Guard],
    };
  }
}