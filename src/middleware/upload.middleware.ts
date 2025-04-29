import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import { UploadApiResponse } from 'cloudinary/types';

import cloudinary from '../lib/cloudinary';
import { RequestWithUser } from '../interfaces';
import { BadRequestException, UnauthorizedException } from '../exceptions';

const storage = multer.memoryStorage();
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg'];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new BadRequestException(
        `Only ${allowedMimeTypes.join(', ')} files are allowed`,
      ),
    );
  }
  cb(null, true);
};
const limits = { fileSize: 5 * 1024 * 1024 };
const upload = multer({ storage, fileFilter, limits });

export const uploadProfilePic = upload.single('profilePic');
export const uploadMessageImage = upload.single('image');

export const uploadProfilePicMiddleware = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  if (!req.file) return next();
  if (!req.user) throw new BadRequestException('User not found');

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chatty_profile_pics',
          public_id: req.user!._id,
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) return reject(error);

          resolve(result);
        },
      );
      Readable.from(req.file?.buffer ?? []).pipe(uploadStream);
    });

    req.body.profilePic = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
};

export const uploadMessageImageMiddleware = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw new UnauthorizedException('You must be logged in to send a message');
  }
  if (!req.params.id) {
    throw new BadRequestException('Receiver not provided');
  }
  if (req.user._id === req.params.id) {
    throw new BadRequestException('Cannot send message to yourself');
  }

  if (!req.file) return next();

  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chatty_message_images',
          public_id: `msg_${req.user!._id}`,
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) return reject(error);

          resolve(result);
        },
      );
      Readable.from(req.file?.buffer ?? []).pipe(uploadStream);
    });

    req.body.image = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
};
