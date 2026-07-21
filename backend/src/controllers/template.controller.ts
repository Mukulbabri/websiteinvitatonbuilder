import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isPublished: true },
      include: { category: true },
    });
    return sendResponse(res, 200, true, 'Templates retrieved', templates);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { templates: true } } },
    });
    return sendResponse(res, 200, true, 'Categories retrieved', categories);
  } catch (error) {
    next(error);
  }
};

export const getPlanFeatures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.planFeature.findMany();
    const map: Record<string, any> = {};
    plans.forEach((p) => {
      map[p.planKey.toLowerCase()] = p;
    });
    return sendResponse(res, 200, true, 'Plan features retrieved', map);
  } catch (error) {
    next(error);
  }
};
