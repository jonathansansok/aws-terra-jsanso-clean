import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { Product } from '@prisma/client';
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {
    console.log('[OrdersService] ctor');
  }

  async list() {
    console.log('[OrdersService] list');
    const rows = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
      },
    });
    console.log('[OrdersService] list ok', { count: rows.length });
    return rows;
  }

  async create(dto: CreateOrderDto) {
    console.log('[OrdersService] create in', dto);

    if (!dto.items?.length) {
      console.log('[OrdersService] create reject empty items');
      throw new BadRequestException('items is required');
    }

    const productIds = Array.from(new Set(dto.items.map((i) => i.productId)));
    console.log('[OrdersService] productIds', productIds);

    const products: Product[] = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    console.log('[OrdersService] products found', { count: products.length });

    if (products.length !== productIds.length) {
      const found = new Set<string>(products.map((p) => p.id));
      const missing = productIds.filter((id) => !found.has(id));
      console.log('[OrdersService] missing products', missing);
      throw new BadRequestException(`missing products: ${missing.join(', ')}`);
    }

    const priceById = new Map<string, number>(products.map((p) => [p.id, Number(p.price)]));

    const items = dto.items.map((i) => {
      const unitPrice = priceById.get(i.productId) || 0;
      const lineTotal = unitPrice * i.quantity;
      return {
        productId: i.productId,
        quantity: i.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const total = items.reduce((acc, it) => acc + it.lineTotal, 0);

    console.log('[OrdersService] computed', { total, itemsCount: items.length });
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          total: String(total),
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: String(it.unitPrice),
              lineTotal: String(it.lineTotal),
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });
      return created;
    });

    console.log('[OrdersService] create ok', { id: order.id, total: order.total });
    return order;
  }
}
