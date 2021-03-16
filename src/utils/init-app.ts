import * as cookieParser from 'cookie-parser';
import { DataFormatInterceptor } from './data.interceptor';
import { INestApplication } from '@nestjs/common';

export const initApp = (app: INestApplication, { usePrefix = false } = {}) => {
  app.use(cookieParser());
  app.useGlobalInterceptors(new DataFormatInterceptor());

  if (usePrefix) app.setGlobalPrefix('/v1/api');

  return app;
};

export default initApp;
