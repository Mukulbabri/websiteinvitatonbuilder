import { PrismaClient, Role, Plan, BlessingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Default Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@wedding.com' },
    update: {},
    create: {
      email: 'admin@wedding.com',
      name: 'Site Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
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
    where: { planKey: Plan.STARTER },
    update: {},
    create: {
      planKey: Plan.STARTER,
      name: 'Starter Plan',
      price: 0,
      galleryLimit: 5,
      enableMusic: false,
      enableWatermarkRemoval: false,
    },
  });

  await prisma.planFeature.upsert({
    where: { planKey: Plan.PREMIUM },
    update: {},
    create: {
      planKey: Plan.PREMIUM,
      name: 'Premium Invitation',
      price: 1499,
      galleryLimit: 30,
      enableMusic: true,
      enableWatermarkRemoval: true,
    },
  });

  await prisma.planFeature.upsert({
    where: { planKey: Plan.ROYAL },
    update: {},
    create: {
      planKey: Plan.ROYAL,
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
      plan: Plan.ROYAL,
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
