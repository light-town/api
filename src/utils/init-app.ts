import * as cookieParser from 'cookie-parser';
import { DataFormatInterceptor } from './data.interceptor';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

export const initApp = (app: INestApplication, { usePrefix = false } = {}) => {
  app.enableCors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  });
  app.use(cookieParser());
  app.useGlobalInterceptors(new DataFormatInterceptor());

  if (usePrefix) app.setGlobalPrefix('/v1/api');

  return app;
};

export default initApp;
