// Assign store to Admin Manager
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'cmpcapl2b0001eizk4jl1niqx'; // Admin Manager
  const storeId = 'cmpc7n35i000heiqolrgpg24d'; // Plant 1 Main
  
  console.log('Assigning store to user...');
  
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { storeId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      storeId: true,
      store: { select: { name: true, code: true } }
    }
  });
  
  console.log('\n✓ Store assigned successfully!');
  console.log(`\nUser: ${updated.name} (${updated.email})`);
  console.log(`Role: ${updated.role}`);
  console.log(`Store: ${updated.store?.code} - ${updated.store?.name}`);
  console.log(`\nPlease refresh your browser to see the changes.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
