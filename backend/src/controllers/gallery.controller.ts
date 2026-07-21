import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const getGallery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const items = await prisma.galleryItem.findMany({
      where: { siteId },
      orderBy: { sortOrder: 'asc' },
    });
    return sendResponse(res, 200, true, 'Gallery items retrieved', items);
  } catch (error) {
    next(error);
  }
};

export const addGalleryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const { url, caption, category, sortOrder } = req.body;

    const item = await prisma.galleryItem.create({
      data: { siteId, url, caption, category, sortOrder: sortOrder || 0 },
    });
    return sendResponse(res, 201, true, 'Gallery image added', item);
  } catch (error) {
    next(error);
  }
};

export const deleteGalleryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.galleryItem.delete({ where: { id } });
    return sendResponse(res, 200, true, 'Gallery item deleted');
  } catch (error) {
    next(error);
  }
};
