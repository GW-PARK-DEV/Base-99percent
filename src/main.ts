import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*',
  });

  setupSwagger(app);

  await app.listen(3000);
}

function setupSwagger(app: any) {
  const config = new DocumentBuilder()
    .setTitle('99percent API')
    .setDescription('99percent의 API 문서입니다.')
    .setVersion('1.0')
    .addTag('product-analysis', '물건 상태 분석')
    .addTag('bunjang-search', '번개장터 검색')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}

bootstrap();
