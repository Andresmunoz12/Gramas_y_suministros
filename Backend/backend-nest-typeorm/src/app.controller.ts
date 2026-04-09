import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get()
  getHello(): string {
    console.log('¡Hola, se recargó Docker solo!');
    return this.appService.getHello();
  }
}
