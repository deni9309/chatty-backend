import { IsOptional, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @MaxLength(2000, {
    message: 'Message text must be at most 2000 characters long',
  })
  text?: string;

  @IsOptional()
  image?: string;
}
