import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor() {
    console.log('[HealthController] ctor');
  }

  @Get()
  @ApiOkResponse({ description: 'ALB/ECS health check' })
  getHealth() {
    console.log('[HealthController] GET /health');
    return { ok: true, ts: new Date().toISOString() };
  }
}
