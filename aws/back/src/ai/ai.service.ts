import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class AiService {
  private readonly client: Anthropic;

  constructor(private readonly statsService: StatsService) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async describeProduct(name: string, price?: number): Promise<string> {
    const priceHint = price !== undefined ? ` priced at $${price.toFixed(2)}` : '';
    const prompt =
      `Write a short, enticing product description for a POS catalog item` +
      ` named "${name}"${priceHint}. ` +
      `Max 150 characters. No quotes. Just the description text.`;

    const msg = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = msg.content[0];
    const raw = block.type === 'text' ? block.text.trim() : '';
    return raw.slice(0, 150);
  }

  async chat(message: string): Promise<string> {
    const stats = await this.statsService.getDashboard();

    const topList = stats.topProducts
      .map((p) => `${p.name} ($${Number(p.revenue).toFixed(2)})`)
      .join(', ');

    const systemPrompt = [
      `You are a helpful backoffice assistant for a POS system.`,
      `Current business data:`,
      `- Total revenue: $${Number(stats.totalRevenue).toFixed(2)}`,
      `- Total orders: ${stats.totalOrders}`,
      `- Orders today: ${stats.ordersToday}`,
      `- Revenue today: $${Number(stats.revenueToday).toFixed(2)}`,
      `- Total products: ${stats.totalProducts} (${stats.activeProducts} active)`,
      `- Top products: ${topList || 'none yet'}`,
      `Answer concisely and professionally.`,
    ].join('\n');

    const msg = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const block = msg.content[0];
    return block.type === 'text' ? block.text.trim() : '';
  }
}
