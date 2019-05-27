import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { ViewData } from './app.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  root(): ViewData {
    return { app: 'public' }
  }
}
