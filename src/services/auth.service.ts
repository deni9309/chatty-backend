import { injectable } from 'tsyringe';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { FilterQuery, Types } from 'mongoose';
import { RegisterDto } from '../dtos/auth/register.dto';
import {
  BadRequestException,
  ConflictException,
  GoneException,
  InternalServerErrorException,
  UnauthorizedException,
} from '../exceptions';
import { Response } from 'express';
import { TokenPayload } from '../types/token-payload';
import { MONGODB } from '../constants/db-constants';
import { LoginDto } from '../dtos/auth/login.dto';
import { IUser } from '../interfaces/user.interface';
import { UpdateUserDto } from '../dtos/auth/update-user.dto';

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
    return this.mapUserResponse(user);
  }

  async login({ email, password }: LoginDto, res: Response) {
    const dbUsers = await User.find({ email });
    if (dbUsers?.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const dbUser = dbUsers.filter((u) => u.isDeleted === false);
    if (dbUser.length === 0) {
      throw new GoneException('This user account is no longer available');
    }

    const isMatch = await bcrypt.compare(password, dbUser[0].password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.generateToken(dbUser[0], res);
    return this.mapUserResponse(dbUser[0]);
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
      maxAge: 3600000,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return token;
  }

  async updateUser(id: string, data: UpdateUserDto) {
    const user = await User.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      data,
      { new: true },
    )
      .select('-password')
      .lean<Partial<IUser>>();

    return user;
  }

  mapUserResponse(user: IUser): Partial<IUser> {
    return {
      email: user.email,
      fullName: user.fullName,
      profilePic: user.profilePic,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async verifyUser(email: string) {
    const user = await User.findOne(
      { email, isDeleted: false },
      { _id: 1, email: 1, fullName: 1, profilePic: 1 },
    );

    if (!user) throw new UnauthorizedException();

    const verifiedUser: TokenPayload = {
      _id: (user._id as any).toHexString(),
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    };

    return verifiedUser;
  }
}
