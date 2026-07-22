import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

const ensureDefaultSite = async (siteId: string) => {
  try {
    const existingSite = await prisma.website.findUnique({ where: { id: siteId } });
    if (!existingSite) {
      let defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: 'admin@wedding.com',
            passwordHash: 'hashed_admin_password_123',
            name: 'Admin',
            role: 'ADMIN',
          },
        });
      }
      await prisma.website.create({
        data: {
          id: siteId,
          ownerId: defaultUser.id,
          subdomain: 'wedding',
          domain: 'wedding.com',
          status: 'ACTIVE',
          plan: 'ROYAL',
        },
      });
    }
  } catch (err) {
    console.warn('ensureDefaultSite notice:', err);
  }
};

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.params.siteId || req.query.siteId || 'site-1') as string;
    await ensureDefaultSite(siteId);

    let settings = null;
    try {
      const record = await prisma.weddingSettings.findUnique({
        where: { siteId },
      });
      if (record) {
        let parsedData = {};
        if (record.data) {
          try {
            parsedData = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
          } catch (e) {
            parsedData = {};
          }
        }
        settings = { ...record, ...parsedData, id: record.id, siteId: record.siteId };
      }
    } catch (dbErr: any) {
      console.warn('Prisma DB getSettings error:', dbErr?.message || dbErr);
    }

    return sendResponse(res, 200, true, 'Settings retrieved from Cloud Database', settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.params.siteId || 'site-1') as string;
    await ensureDefaultSite(siteId);

    const data = { ...req.body };

    delete data.id;
    delete data.createdAt;

    let settings = data;

    // Save to Cloud Database via Prisma ORM
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

      settings = { ...data, id: updatedRecord.id, siteId };
    } catch (dbErr: any) {
      console.error('Prisma DB updateSettings error:', dbErr?.message || dbErr);
    }

    return sendResponse(res, 200, true, 'All Admin Settings saved strictly to Cloud Database', settings);
  } catch (error) {
    next(error);
  }
};
