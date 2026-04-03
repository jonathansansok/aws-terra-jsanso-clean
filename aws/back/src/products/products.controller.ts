import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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

  @Patch(':id')
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ description: 'Update product' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    console.log('[ProductsController] PATCH /products/:id', { id, dto });
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Delete product' })
  async remove(@Param('id') id: string) {
    console.log('[ProductsController] DELETE /products/:id', { id });
    return this.service.remove(id);
  }
}
