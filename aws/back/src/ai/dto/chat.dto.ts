import { IsString, MaxLength } from 'class-validator';

export class ChatDto {
  @IsString()
  @MaxLength(1000)
  message!: string;
}
