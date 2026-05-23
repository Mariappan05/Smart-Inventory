const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function seed() {
  const prisma = new PrismaClient();
  
  try {
    // Create store
    const store = await prisma.store.create({
      data: {
        name: 'Chennai',
        code: 'STORE001',
      },
    });
    console.log('Created store:', store.name);
    
    // Create admin user
    const hash = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
      data: {
        employeeNo: 'ADM001',
        email: 'admin@your-company.local',
        name: 'Avery Patel',
        role: 'ADMIN',
        hashedPassword: hash,
        isActive: true,
        storeId: store.id,
      },
    });
    console.log('Created user:', user.email);
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
