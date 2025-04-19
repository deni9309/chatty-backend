import { injectable } from 'tsyringe';
import User from '../models/user.model';
import { FilterQuery } from 'mongoose';

@injectable()
export class AuthService {
  async register(data: { fullName: string; email: string; password: string }) {
    const user = new User(data);
    return await user.save();
  }

  async findOne(filter: FilterQuery<typeof User>) {
    return User.findOne({ ...filter, isDeleted: false }).exec();
  }

  async userExists(email: string) {
    return User.exists({ email, isDeleted: false });
  }
}
