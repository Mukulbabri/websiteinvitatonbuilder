"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Create Default Admin User
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@wedding.com' },
        update: {},
        create: {
            email: 'admin@wedding.com',
            name: 'Super Admin',
            passwordHash: adminPassword,
            role: client_1.Role.ADMIN,
        },
    });
    console.log('✅ Admin user created:', adminUser.email);
    // 2. Create Default Categories
    const royalCat = await prisma.category.upsert({
        where: { slug: 'royal-traditional' },
        update: {},
        create: {
            name: 'Royal & Traditional',
            slug: 'royal-traditional',
            description: 'Elegant Indian heritage wedding invitations',
        },
    });
    // 3. Create Default Template
    const defaultTemplate = await prisma.template.upsert({
        where: { slug: 'royal-gold-luxury' },
        update: {},
        create: {
            name: 'Royal Gold Luxury',
            slug: 'royal-gold-luxury',
            description: 'Golden animated luxury wedding invitation with gate reveal & audio player',
            categoryId: royalCat.id,
            isPublished: true,
        },
    });
    // 4. Create Plan Features
    await prisma.planFeature.upsert({
        where: { planKey: client_1.Plan.STARTER },
        update: {},
        create: {
            planKey: client_1.Plan.STARTER,
            name: 'Starter Plan',
            price: 0,
            galleryLimit: 5,
            enableMusic: false,
            enableWatermarkRemoval: false,
        },
    });
    await prisma.planFeature.upsert({
        where: { planKey: client_1.Plan.PREMIUM },
        update: {},
        create: {
            planKey: client_1.Plan.PREMIUM,
            name: 'Premium Invitation',
            price: 1499,
            galleryLimit: 30,
            enableMusic: true,
            enableWatermarkRemoval: true,
        },
    });
    await prisma.planFeature.upsert({
        where: { planKey: client_1.Plan.ROYAL },
        update: {},
        create: {
            planKey: client_1.Plan.ROYAL,
            name: 'Royal Elite',
            price: 3999,
            galleryLimit: 9999,
            enableMusic: true,
            enableWatermarkRemoval: true,
            enableCustomDomain: true,
            enablePrioritySupport: true,
            enablePdfDownload: true,
            enableMultilang: true,
        },
    });
    console.log('✅ Plan features seeded');
    // 5. Create Default Website & Settings
    const site = await prisma.website.upsert({
        where: { id: 'site-1' },
        update: {},
        create: {
            id: 'site-1',
            ownerId: adminUser.id,
            templateId: defaultTemplate.id,
            subdomain: 'wedding',
            domain: 'rahulwedsneha.com',
            status: 'ACTIVE',
            plan: client_1.Plan.ROYAL,
        },
    });
    await prisma.weddingSettings.upsert({
        where: { siteId: site.id },
        update: {},
        create: {
            siteId: site.id,
            coupleName: 'Rahul & Neha',
            brideName: 'Neha Sharma',
            groomName: 'Rahul Verma',
            weddingDate: '2026-11-25T18:00:00',
            weddingVenue: 'The Grand Palace, New Delhi',
            musicUrl: '/From Klickpin.com- Pin this creative beach trip roundup to make your next project easier and prettier with practical inspiration you can use right.mp4',
            gateTitle: 'Wedding Invitation',
            gateSubtitle: 'Tap to Open & Celebrate',
            enableFloatingPetals: true,
        },
    });
    // Seed default events
    await prisma.event.createMany({
        data: [
            { siteId: site.id, eventName: 'Haldi Ceremony', eventDate: '2026-11-24', eventTime: '10:00 AM', venueName: 'Royal Lawns, New Delhi', sortOrder: 1 },
            { siteId: site.id, eventName: 'Mehndi & Sangeet', eventDate: '2026-11-24', eventTime: '06:00 PM', venueName: 'Grand Ballroom', sortOrder: 2 },
            { siteId: site.id, eventName: 'Wedding Ceremony (Pheras)', eventDate: '2026-11-25', eventTime: '07:00 PM', venueName: 'The Palace Mandap', sortOrder: 3 },
            { siteId: site.id, eventName: 'Grand Reception', eventDate: '2026-11-26', eventTime: '08:00 PM', venueName: 'Imperial Banquet', sortOrder: 4 },
        ],
        skipDuplicates: true,
    });
    console.log('🎉 Database seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
