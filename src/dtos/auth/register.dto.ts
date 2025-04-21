import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
