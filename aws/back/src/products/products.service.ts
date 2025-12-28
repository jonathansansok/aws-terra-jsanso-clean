import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {
    console.log('[ProductsService] ctor');
  }

  async list() {
    console.log('[ProductsService] list');
    const rows = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log('[ProductsService] list ok', { count: rows.length });
    return rows;
  }

  async create(dto: CreateProductDto) {
    console.log('[ProductsService] create in', dto);
    const row = await this.prisma.product.create({
      data: {
        name: dto.name,
        price: String(dto.price),
      },
    });
    console.log('[ProductsService] create ok', { id: row.id });
    return row;
  }
}
