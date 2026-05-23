const { PrismaClient } = require('@prisma/client');

async function verify() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, storeId: true } });
    const stores = await prisma.store.findMany({ select: { id: true, name: true } });
    
    console.log('✅ Database Status:');
    console.log(`   Stores: ${stores.length}`);
    console.log(`   Users: ${users.length}`);
    
    if (stores.length > 0) {
      console.log(`   Store: ${stores[0].name} (${stores[0].id})`);
    }
    if (users.length > 0) {
      console.log(`   User: ${users[0].email} -> Store: ${users[0].storeId}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verify();
