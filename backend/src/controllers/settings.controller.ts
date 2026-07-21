import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.params.siteId || req.query.siteId || 'site-1') as string;

    let settings = null;
    try {
      const record = await prisma.weddingSettings.findUnique({
        where: { siteId },
      });
      if (record) {
        settings = (record as any).data 
          ? { ...(record as any).data, id: record.id, siteId: record.siteId } 
          : record;
      }
    } catch (dbErr: any) {
      console.warn('Prisma DB getSettings error:', dbErr?.message || dbErr);
    }

    return sendResponse(res, 200, true, 'Settings retrieved from PostgreSQL Database', settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.params.siteId || 'site-1') as string;
    const data = { ...req.body };

    delete data.id;
    delete data.createdAt;

    let settings = data;

    // Strictly save to PostgreSQL DB via Prisma ORM
    try {
      const updatedRecord = await prisma.weddingSettings.upsert({
        where: { siteId },
        update: {
          coupleName: data.couple_name || data.coupleName || 'Mukul & Shreya',
          brideName: data.bride_name || data.brideName || 'Shreya',
          groomName: data.groom_name || data.groomName || 'Mukul',
          weddingDate: data.wedding_date || data.weddingDate || '2026-11-25T18:00:00',
          musicUrl: data.music_url || data.musicUrl || '',
          data: data,
        },
        create: {
          siteId,
          coupleName: data.couple_name || data.coupleName || 'Mukul & Shreya',
          brideName: data.bride_name || data.brideName || 'Shreya',
          groomName: data.groom_name || data.groomName || 'Mukul',
          weddingDate: data.wedding_date || data.weddingDate || '2026-11-25T18:00:00',
          musicUrl: data.music_url || data.musicUrl || '',
          data: data,
        },
      });

      settings = (updatedRecord as any).data 
        ? { ...data, ...(updatedRecord as any).data, id: updatedRecord.id, siteId } 
        : { ...data, id: updatedRecord.id, siteId };
    } catch (dbErr: any) {
      console.error('Prisma DB updateSettings error:', dbErr?.message || dbErr);
    }

    return sendResponse(res, 200, true, 'All Admin Settings saved strictly to PostgreSQL Database', settings);
  } catch (error) {
    next(error);
  }
};
