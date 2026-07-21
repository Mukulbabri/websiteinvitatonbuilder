import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as settingsController from '../controllers/settings.controller';
import * as eventController from '../controllers/event.controller';
import * as galleryController from '../controllers/gallery.controller';
import * as rsvpController from '../controllers/rsvp.controller';
import * as blessingController from '../controllers/blessing.controller';
import * as analyticsController from '../controllers/analytics.controller';
import * as templateController from '../controllers/template.controller';
import * as websiteController from '../controllers/website.controller';
import * as orderController from '../controllers/order.controller';
import * as uploadController from '../controllers/upload.controller';

import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, eventSchema, rsvpSchema, blessingSchema } from '../validators';

const router = Router();

// Auth Routes
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticate, authController.getMe);

// Tenant & Website Details Routes
router.get('/tenant/detect', websiteController.detectTenant);
router.get('/sites/:siteId/details', websiteController.getWebsiteDetails);
router.get('/sites/:siteId/plan', websiteController.getWebsitePlan);

// Settings Routes
router.get('/settings', settingsController.getSettings);
router.get('/sites/:siteId/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);
router.put('/sites/:siteId/settings', settingsController.updateSettings);

// Event Routes
router.get('/events', eventController.getEvents);
router.post('/events', validate(eventSchema), eventController.createOrUpdateEvent);
router.delete('/events/:id', eventController.deleteEvent);
router.post('/events/reorder', eventController.reorderEvents);

// Gallery Routes
router.get('/gallery', galleryController.getGallery);
router.post('/gallery', galleryController.addGalleryItem);
router.delete('/gallery/:id', galleryController.deleteGalleryItem);

// RSVP Routes
router.get('/rsvp', rsvpController.getRSVPs);
router.post('/rsvp', validate(rsvpSchema), rsvpController.submitRSVP);
router.delete('/rsvp/:id', rsvpController.deleteRSVP);

// Blessing Routes
router.get('/blessings', blessingController.getBlessings);
router.post('/blessings', validate(blessingSchema), blessingController.submitBlessing);
router.put('/blessings/:id/approve', blessingController.approveBlessing);
router.delete('/blessings/:id', blessingController.deleteBlessing);

// Analytics Routes
router.post('/analytics/visitor', analyticsController.logVisitor);
router.get('/analytics/stats', analyticsController.getVisitorStats);

// Template & Plan Feature Routes
router.get('/templates', templateController.getTemplates);
router.get('/categories', templateController.getCategories);
router.get('/plans', templateController.getPlanFeatures);

// Order & Payment Routes
router.post('/orders', authenticate, orderController.createOrder);
router.post('/orders/verify', authenticate, orderController.verifyPayment);

// Upload Route (Multer + Cloudflare R2)
router.post('/upload', upload.single('file'), uploadController.uploadMedia);
router.delete('/upload', uploadController.deleteMedia);

export default router;
