import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import initApp from './utils/init-app';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = initApp(await NestFactory.create(AppModule), { usePrefix: true });

  const config = new DocumentBuilder()
    .setTitle('Light Town')
    .setDescription('A open-source password manager 🔑')
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/v1/api/docs', app, document);

  await app.listen(process.env.PORT);
}
bootstrap();
