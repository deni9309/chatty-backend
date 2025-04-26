import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({ message: 'Message text is required' })
  @MinLength(1, { message: 'Message text must be at least 1 character long' })
  @MaxLength(2000, {
    message: 'Message text must be at most 2000 characters long',
  })
  text!: string;

  @IsOptional()
  image?: string;
}
