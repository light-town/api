import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as dotenv from 'dotenv';
import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';
import { DataFormatInterceptor } from './data.interceptor';

dotenv.config();

export const initApp = (
  app: INestApplication,
  { usePrefix = false, useCsurf = false } = {}
) => {
  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  });
  app.useGlobalInterceptors(new DataFormatInterceptor());

  if (useCsurf)
    app.use(
      csurf({
        cookie: true,
        value: req => <string>req.headers['x-csrf-token'],
      })
    );

  if (usePrefix) app.setGlobalPrefix('/v1/api');

  app.useWebSocketAdapter(new WsAdapter(app));

  return app;
};

export default initApp;
