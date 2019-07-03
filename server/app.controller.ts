import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { ViewData } from './app.interface';
import { ConfigService } from './config/config.service';

@Controller()
export class AppController {

  constructor(private readonly configService: ConfigService) {}

  getSentryData(): string {
    return JSON.stringify({
      dsn: this.configService.sentryDSN,
      release: this.configService.sentryRelease,
    })
  }

  @Get()
  @Render('index')
  root(): ViewData {
    return { app: 'public', sentry: this.getSentryData() }
  }

  @Get('live')
  @Render('index')
  streamingClient(): ViewData {
    return { app: 'client', sentry: this.getSentryData() }
  }

  @Get('present')
  @Render('index')
  presenter(): ViewData {
    return { app: 'presenter', sentry: this.getSentryData() }
  }

  @Get('dashboard')
  @Render('index')
  dashboard(): ViewData {
    return { app: 'dashboard', sentry: this.getSentryData() }
  }
}
