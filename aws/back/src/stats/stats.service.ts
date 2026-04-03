import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, totalProducts, activeProducts, revenueAgg, todayOrders] =
      await Promise.all([
        this.prisma.order.count(),
        this.prisma.product.count(),
        this.prisma.product.count({ where: { active: true } }),
        this.prisma.order.aggregate({ _sum: { total: true } }),
        this.prisma.order.findMany({
          where: { createdAt: { gte: today } },
          select: { total: true },
        }),
      ]);

    const totalRevenue = Number(revenueAgg._sum.total ?? 0);
    const ordersToday = todayOrders.length;
    const revenueToday = todayOrders.reduce((s, o) => s + Number(o.total), 0);

    const rawByDay = await this.prisma.$queryRaw<
      { date: string; orders: bigint; revenue: string }[]
    >`
      SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') as date,
             COUNT(*) as orders,
             CAST(SUM(total) AS CHAR) as revenue
      FROM \`Order\`
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
      ORDER BY date ASC
    `;

    const revenueByDay = rawByDay.map((r) => ({
      date: String(r.date),
      orders: Number(r.orders),
      revenue: parseFloat(r.revenue),
    }));

    const rawTop = await this.prisma.$queryRaw<
      { name: string; revenue: string; units: bigint }[]
    >`
      SELECT p.name,
             CAST(SUM(oi.lineTotal) AS CHAR) as revenue,
             SUM(oi.quantity) as units
      FROM OrderItem oi
      JOIN Product p ON p.id = oi.productId
      GROUP BY p.id, p.name
      ORDER BY SUM(oi.lineTotal) DESC
      LIMIT 5
    `;

    const topProducts = rawTop.map((r) => ({
      name: r.name,
      revenue: parseFloat(r.revenue),
      units: Number(r.units),
    }));

    return {
      totalRevenue,
      totalOrders,
      ordersToday,
      revenueToday,
      totalProducts,
      activeProducts,
      revenueByDay,
      topProducts,
    };
  }
}
