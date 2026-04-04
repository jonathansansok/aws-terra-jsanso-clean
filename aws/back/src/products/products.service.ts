//aws\back\src\products\products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
        ...(dto.active !== undefined && { active: dto.active }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
    console.log('[ProductsService] create ok', { id: row.id });
    return row;
  }

  async update(id: string, dto: UpdateProductDto) {
    console.log('[ProductsService] update', { id, dto });
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Product ${id} not found`);
    const row = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: String(dto.price) }),
        ...(dto.active !== undefined && { active: dto.active }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
    console.log('[ProductsService] update ok', { id: row.id });
    return row;
  }

  async remove(id: string) {
    console.log('[ProductsService] remove', { id });
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Product ${id} not found`);
    await this.prisma.product.delete({ where: { id } });
    console.log('[ProductsService] remove ok', { id });
    return { ok: true };
  }
}
