import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const getBlessings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const blessings = await prisma.blessing.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
    });
    return sendResponse(res, 200, true, 'Blessings retrieved', blessings);
  } catch (error) {
    next(error);
  }
};

export const submitBlessing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const { name, message } = req.body;

    const blessing = await prisma.blessing.create({
      data: {
        siteId,
        name,
        message,
        status: 'APPROVED',
      },
    });

    // Increment count in settings
    await prisma.weddingSettings.updateMany({
      where: { siteId },
      data: { blessingsCount: { increment: 1 } },
    });

    return sendResponse(res, 201, true, 'Blessing submitted', blessing);
  } catch (error) {
    next(error);
  }
};

export const approveBlessing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.blessing.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
    return sendResponse(res, 200, true, 'Blessing approved', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteBlessing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.blessing.delete({ where: { id } });
    return sendResponse(res, 200, true, 'Blessing deleted');
  } catch (error) {
    next(error);
  }
};
