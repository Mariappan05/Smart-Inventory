// Cleanup script to identify unused tables and columns
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Database Cleanup Analysis ===\n');
  
  // Check Notification usage
  console.log('1. Checking Notifications...');
  const notificationCount = await prisma.notification.count();
  console.log(`   Total notifications: ${notificationCount}`);
  
  // Check AuditLog usage
  console.log('\n2. Checking AuditLogs...');
  const auditLogCount = await prisma.auditLog.count();
  console.log(`   Total audit logs: ${auditLogCount}`);
  
  // Check ProductMaintenanceLog usage
  console.log('\n3. Checking ProductMaintenanceLogs...');
  const maintenanceCount = await prisma.productMaintenanceLog.count();
  console.log(`   Total maintenance logs: ${maintenanceCount}`);
  
  // Check ProductMovementLog usage
  console.log('\n4. Checking ProductMovementLogs...');
  const movementCount = await prisma.productMovementLog.count();
  console.log(`   Total movement logs: ${movementCount}`);
  
  console.log('\n=== Recommendations ===');
  console.log('\nTables that can be removed if count is 0 and not used in UI:');
  if (notificationCount === 0) console.log('  - Notification');
  if (auditLogCount === 0) console.log('  - AuditLog');
  if (maintenanceCount === 0) console.log('  - ProductMaintenanceLog');
  if (movementCount === 0) console.log('  - ProductMovementLog');
  
  console.log('\n=== Column Analysis ===');
  
  // Check for null columns in Product
  const productsWithNullPrice = await prisma.product.count({
    where: { price: null }
  });
  console.log(`\nProducts with null price: ${productsWithNullPrice}`);
  
  // Check for null columns in Item
  const itemsWithNullUnitPrice = await prisma.item.count({
    where: { unitPrice: null }
  });
  console.log(`Items with null unitPrice: ${itemsWithNullUnitPrice}`);
  
  console.log('\n=== Cleanup Complete ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
