import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const getWebsiteDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.params.siteId || 'site-1') as string;
    const website = await prisma.website.findUnique({
      where: { id: siteId },
      include: { settings: true, events: true },
    });
    return sendResponse(res, 200, true, 'Website details retrieved', website || { id: siteId, subdomain: 'wedding', plan: 'ROYAL', status: 'ACTIVE' });
  } catch (error) {
    next(error);
  }
};

export const getWebsitePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = (req.params.siteId || 'site-1') as string;
    const website = await prisma.website.findUnique({
      where: { id: siteId },
      select: { plan: true },
    });
    return sendResponse(res, 200, true, 'Plan retrieved', { plan: website?.plan ? website.plan.toLowerCase() : 'royal' });
  } catch (error) {
    next(error);
  }
};

export const detectTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subdomain, domain, siteId } = req.query;
    if (siteId) {
      const website = await prisma.website.findUnique({ where: { id: siteId as string } });
      if (website) return sendResponse(res, 200, true, 'Tenant detected', website);
    }
    if (subdomain) {
      const website = await prisma.website.findUnique({ where: { subdomain: subdomain as string } });
      if (website) return sendResponse(res, 200, true, 'Tenant detected', website);
    }
    if (domain) {
      const website = await prisma.website.findUnique({ where: { domain: domain as string } });
      if (website) return sendResponse(res, 200, true, 'Tenant detected', website);
    }
    const defaultSite = { id: 'site-1', ownerId: 'usr-3', subdomain: 'wedding', domain: 'rahulwedsneha.com', status: 'ACTIVE', plan: 'ROYAL' };
    return sendResponse(res, 200, true, 'Default tenant', defaultSite);
  } catch (error) {
    next(error);
  }
};
