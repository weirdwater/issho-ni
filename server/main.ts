import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module';
import { join } from 'path';
import * as Sentry from '@sentry/node'
import * as dotenv from 'dotenv'
import { getEnv } from './config/config.helpers';
import { isNone, isSome } from '../shared/fun';

dotenv.config()
const dsn = getEnv('SENTRY_DSN')
const ver = getEnv('SENTRY_RELEASE')
if (isNone(dsn)) {
  // tslint:disable-next-line:no-console
  console.error('Environment variable SENTRY_DSN not set.')
  process.exit(1)
} else {
  Sentry.init({
    dsn: dsn.v,
    release: isSome(ver) ? ver.v : undefined,
  })
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'static'))
  app.setBaseViewsDir(join(__dirname, 'views'))
  app.setViewEngine('hbs')

  await app.listen(3000);
}
bootstrap();
