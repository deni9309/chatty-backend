import { injectable } from 'tsyringe';
import Message from '../models/message.model';
import { IMessage } from '../interfaces';

@injectable()
export class MessagesService {
  async getMessages() {
    return Message.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .lean<IMessage[]>().exec();
  }
}
