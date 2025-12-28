import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {
    console.log('[ProductsController] ctor');
  }

  @Get()
  @ApiOkResponse({ description: 'List products' })
  async list() {
    console.log('[ProductsController] GET /products');
    return this.service.list();
  }

  @Post()
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({ description: 'Create product' })
  async create(@Body() dto: CreateProductDto) {
    console.log('[ProductsController] POST /products', dto);
    return this.service.create(dto);
  }
}
