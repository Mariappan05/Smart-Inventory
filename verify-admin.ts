const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function verify() {
  const prisma = new PrismaClient();
  
  try {
    // Fetch the admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@your-company.local' },
    });

    if (!admin) {
      console.log('❌ Admin user not found in database');
      console.log('\nCreating admin user with password: Admin@123');
      
      // Create store if it doesn't exist
      const store = await prisma.store.findFirst({
        where: { code: 'STORE001' }
      });
      
      if (!store) {
        console.log('Store not found, creating...');
        const newStore = await prisma.store.create({
          data: { name: 'Chennai', code: 'STORE001' }
        });
        console.log('✅ Store created:', newStore.name);
      }
      
      const hash = await bcrypt.hash('Admin@123', 10);
      const newAdmin = await prisma.user.create({
        data: {
          employeeNo: 'ADM001',
          email: 'admin@your-company.local',
          name: 'Admin',
          role: 'ADMIN',
          hashedPassword: hash,
          isActive: true,
          storeId: store?.id,
        },
      });
      console.log('✅ Admin user created');
      return;
    }

    console.log('✅ Admin user found:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
      hashedPasswordLength: admin.hashedPassword?.length || 0,
      hashedPassword: admin.hashedPassword ? admin.hashedPassword.substring(0, 30) + '...' : 'NONE',
    });

    // Test password
    const testPassword = 'Admin@123';
    const isValid = await bcrypt.compare(testPassword, admin.hashedPassword || '');
    console.log(`\n🔐 Password test for "${testPassword}":`, isValid ? '✅ VALID' : '❌ INVALID');

    if (!isValid) {
      console.log('⚠️  Password mismatch! Re-hashing password...');
      const hash = await bcrypt.hash('Admin@123', 10);
      const updated = await prisma.user.update({
        where: { id: admin.id },
        data: { hashedPassword: hash },
      });
      console.log('✅ Password updated');
      const testAgain = await bcrypt.compare('Admin@123', updated.hashedPassword || '');
      console.log('🔐 Password test after update:', testAgain ? '✅ VALID' : '❌ INVALID');
    }

    // List all users
    console.log('\n📋 All users in database:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
    console.table(allUsers);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
