import { injectable } from 'tsyringe';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { FilterQuery } from 'mongoose';
import { RegisterDto } from '../dtos/auth/register.dto';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '../exceptions';
import { Response } from 'express';
import { TokenPayload } from '../types/token-payload';
import { MONGODB } from '../constants/db-constants';
import { LoginDto } from '../dtos/auth/login.dto';
import { IUser } from '../interfaces/user.interface';

@injectable()
export class AuthService {
  async register(data: RegisterDto, res: Response) {
    const existingUser = await this.userExists(data.email);
    if (existingUser) {
      throw new ConflictException('Account with this email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new User({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      profilePic: '',
      isDeleted: false,
    });

    try {
      await user.save();
    } catch (error: any) {
      if (error?.code === MONGODB.DUPLICATE_KEY) {
        throw new ConflictException('Account with this email already in use');
      }

      throw new InternalServerErrorException();
    }

    this.generateToken(user, res);
    return user;
  }

  async login({ email, password }: LoginDto) {
    try {
      const dbUsers = await User.find({ email });

      if (dbUsers.length === 0) {
        throw new UnauthorizedException("User with this email doesn't exist");
      }
      const dbUser = dbUsers.filter((u) => u.isDeleted == false);
      if (dbUser.length === 0) {
        throw new UnauthorizedException('This user account has been deleted');
      }
    } catch (error) {}
  }

  async findOne(filter: FilterQuery<typeof User>) {
    return User.findOne({ ...filter, isDeleted: false }).exec();
  }

  async userExists(email: string) {
    return User.exists({ email, isDeleted: false });
  }

  private generateToken(user: IUser, res: Response) {
    const payload: TokenPayload = {
      _id: (user._id as any).toHexString(),
      email: user.email,
      fullName: user.fullName,
      profilePic: user.profilePic,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    res.cookie('jwt', token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return token;
  }
}
