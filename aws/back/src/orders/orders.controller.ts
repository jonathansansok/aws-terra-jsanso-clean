import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {
    console.log('[OrdersController] ctor');
  }

  @Get()
  @ApiOkResponse({ description: 'List orders' })
  async list() {
    console.log('[OrdersController] GET /orders');
    return this.service.list();
  }

  @Post()
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({ description: 'Create order' })
  async create(@Body() dto: CreateOrderDto) {
    console.log('[OrdersController] POST /orders', dto);
    return this.service.create(dto);
  }
}
