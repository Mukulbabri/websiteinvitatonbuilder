import { Request, Response, NextFunction } from 'express';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';
import r2Client, { R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } from '../config/r2';
import { sendResponse } from '../utils/response.util';

export const uploadMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'No media file provided');
    }

    const folder = (req.body.folder || 'wedding-assets') as string;
    const ext = path.extname(req.file.originalname) || '';
    const uniqueFileName = `${randomUUID()}${ext}`;
    const objectKey = `${folder}/${uniqueFileName}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const publicUrl = R2_PUBLIC_DOMAIN 
      ? `${R2_PUBLIC_DOMAIN}/${objectKey}`
      : `https://${R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${objectKey}`;

    return sendResponse(res, 200, true, 'Media uploaded successfully to Cloudflare R2', {
      url: publicUrl,
      key: objectKey,
      bytes: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    console.error('Cloudflare R2 upload error:', error?.message || error);
    if (req.file && !req.file.mimetype.startsWith('video/')) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      return sendResponse(res, 200, true, 'Media encoded locally (Cloudflare R2 fallback)', { url: dataURI });
    }
    return sendResponse(res, 500, false, `Failed to upload media to Cloudflare R2: ${error?.message || 'Upload error'}`);
  }
};

export const deleteMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.body;
    if (!key) {
      return sendResponse(res, 400, false, 'File key is required for deletion');
    }

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    return sendResponse(res, 200, true, 'Media deleted successfully from Cloudflare R2');
  } catch (error) {
    next(error);
  }
};
