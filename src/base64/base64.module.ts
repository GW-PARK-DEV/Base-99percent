import { Module } from '@nestjs/common';
import { Base64Service } from './base64.service';
import { Base64Controller } from './base64.controller';

@Module({
  controllers: [Base64Controller],
  providers: [Base64Service],
  exports: [Base64Service],
})
export class Base64Module {}
