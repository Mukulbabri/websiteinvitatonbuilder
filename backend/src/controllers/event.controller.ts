import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const events = await prisma.event.findMany({
      where: { siteId },
      orderBy: { sortOrder: 'asc' },
    });
    return sendResponse(res, 200, true, 'Events retrieved', events);
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.query.siteId || 'site-1') as string;
    const { id, eventName, eventDate, eventTime, venueName, venueAddress, mapLink, description, sortOrder } = req.body;

    if (id) {
      const updated = await prisma.event.update({
        where: { id },
        data: { eventName, eventDate, eventTime, venueName, venueAddress, mapLink, description, sortOrder },
      });
      return sendResponse(res, 200, true, 'Event updated', updated);
    } else {
      const created = await prisma.event.create({
        data: { siteId, eventName, eventDate, eventTime, venueName, venueAddress, mapLink, description, sortOrder: sortOrder || 1 },
      });
      return sendResponse(res, 201, true, 'Event created', created);
    }
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id } });
    return sendResponse(res, 200, true, 'Event deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const reorderEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventIds } = req.body;
    if (Array.isArray(eventIds)) {
      for (let i = 0; i < eventIds.length; i++) {
        await prisma.event.update({
          where: { id: eventIds[i] },
          data: { sortOrder: i + 1 },
        });
      }
    }
    return sendResponse(res, 200, true, 'Events reordered');
  } catch (error) {
    next(error);
  }
};
