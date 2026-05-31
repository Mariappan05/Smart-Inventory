const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function setPassword() {
  const prisma = new PrismaClient();
  
  try {
    const hash = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.update({
      where: { email: 'admin@your-company.local' },
      data: { hashedPassword: hash },
    });
    console.log('✅ Admin password set to admin123');
    console.log('Email:', user.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setPassword();
