import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@afshar.af' },
    update: {},
    create: {
      name: 'مدیر سیستم',
      email: 'admin@afshar.af',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const car1 = await prisma.car.create({
    data: {
      carType: 'سدان',
      carName: 'تویوتا کرولا',
      model: '2022',
      color: 'سفید',
      plateNumber: '۱۲۳۴-کابل',
      engineNumber: 'ENG-001',
      status: 'AVAILABLE',
      dailyRate: 2500,
      notes: 'وضعیت خوب',
    },
  });

  const car2 = await prisma.car.create({
    data: {
      carType: 'SUV',
      carName: 'تویوتا لندکروزر',
      model: '2021',
      color: 'مشکی',
      plateNumber: '۵۶۷۸-کابل',
      engineNumber: 'ENG-002',
      status: 'AVAILABLE',
      dailyRate: 5000,
    },
  });

  console.log('✅ Database seeded successfully');
  console.log('Admin:', admin.email, '/ Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
