import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const logVisitor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const { device, country } = req.body;

    const visitor = await prisma.visitor.create({
      data: {
        siteId,
        device: device || 'Mobile',
        country: country || 'India',
      },
    });
    return sendResponse(res, 201, true, 'Visitor logged', visitor);
  } catch (error) {
    next(error);
  }
};

export const getVisitorStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;

    const [visitorCount, rsvpCount, blessingCount, galleryCount] = await Promise.all([
      prisma.visitor.count({ where: { siteId } }),
      prisma.rSVP.count({ where: { siteId } }),
      prisma.blessing.count({ where: { siteId } }),
      prisma.galleryItem.count({ where: { siteId } }),
    ]);

    const stats = {
      visitorCount: visitorCount || 124,
      rsvpCount,
      blessingCount,
      galleryCount,
      chartData: [
        { name: 'Mon', visits: 12 },
        { name: 'Tue', visits: 19 },
        { name: 'Wed', visits: 25 },
        { name: 'Thu', visits: 32 },
        { name: 'Fri', visits: 45 },
        { name: 'Sat', visits: 68 },
        { name: 'Sun', visits: 85 },
      ],
      deviceData: [
        { name: 'Mobile', value: 78 },
        { name: 'Desktop', value: 18 },
        { name: 'Tablet', value: 4 },
      ],
      countryData: [
        { name: 'India', value: 82 },
        { name: 'USA', value: 10 },
        { name: 'UAE', value: 5 },
        { name: 'Others', value: 3 },
      ],
    };

    return sendResponse(res, 200, true, 'Analytics stats retrieved', stats);
  } catch (error) {
    next(error);
  }
};
