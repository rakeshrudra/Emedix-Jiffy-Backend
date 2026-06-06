import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DemoService } from './demo.service';

@ApiTags('demo')
@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) { }

  @Get()
  @ApiOperation({ summary: 'Get demo app string' })
  getApp() {
    return this.demoService.getApp();
  }
}
