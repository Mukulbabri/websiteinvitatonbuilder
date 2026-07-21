import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const getRSVPs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const rsvps = await prisma.rSVP.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
    });
    return sendResponse(res, 200, true, 'RSVPs retrieved', rsvps);
  } catch (error) {
    next(error);
  }
};

export const submitRSVP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const { guestName, guestEmail, guestPhone, attending, guestCount, mealPreference, message } = req.body;

    const rsvp = await prisma.rSVP.create({
      data: {
        siteId,
        guestName,
        guestEmail,
        guestPhone,
        attending: attending !== undefined ? attending : true,
        guestCount: guestCount || 1,
        mealPreference,
        message,
      },
    });
    return sendResponse(res, 201, true, 'RSVP submitted successfully', rsvp);
  } catch (error) {
    next(error);
  }
};

export const deleteRSVP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.rSVP.delete({ where: { id } });
    return sendResponse(res, 200, true, 'RSVP deleted');
  } catch (error) {
    next(error);
  }
};
