import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get()
  @ApiOkResponse({ description: 'Dashboard stats' })
  async dashboard() {
    return this.service.getDashboard();
  }
}
