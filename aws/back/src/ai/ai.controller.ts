import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { DescribeProductDto } from './dto/describe-product.dto';
import { ChatDto } from './dto/chat.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('describe')
  @ApiBody({ type: DescribeProductDto })
  @ApiCreatedResponse({ description: 'Generated product description' })
  async describe(@Body() dto: DescribeProductDto): Promise<{ description: string }> {
    const description = await this.service.describeProduct(dto.name, dto.price);
    return { description };
  }

  @Post('chat')
  @ApiBody({ type: ChatDto })
  @ApiCreatedResponse({ description: 'AI chatbot reply' })
  async chat(@Body() dto: ChatDto): Promise<{ reply: string }> {
    const reply = await this.service.chat(dto.message);
    return { reply };
  }
}
