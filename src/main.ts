import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import initApp from './utils/init-app';
import * as dotenv from 'dotenv';
import { name, version, description } from '../package.json';

dotenv.config();

async function bootstrap() {
  const app = initApp(await NestFactory.create(AppModule), {
    useCors: true,
    useCsurf: true,
    usePrefix: true,
    useWS: true,
  });

  const config = new DocumentBuilder()
    .setTitle(name)
    .setDescription(description)
    .setVersion(version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/v1/api/docs', app, document);

  await app.listen(process.env.PORT);
}
bootstrap();
