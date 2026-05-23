// Fix products without storeId or with wrong storeId
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userStoreId = 'cmpck5nhe000feiz0bfgzyr2u';
  
  console.log('\n=== Checking Products ===');
  
  // Check all products
  const allProducts = await prisma.product.findMany({
    select: { id: true, serial: true, storeId: true }
  });
  
  console.log(`Total products: ${allProducts.length}`);
  
  if (allProducts.length > 0) {
    console.log('\nProducts by storeId:');
    const storeGroups = {};
    allProducts.forEach(p => {
      if (!storeGroups[p.storeId]) storeGroups[p.storeId] = [];
      storeGroups[p.storeId].push(p.serial);
    });
    Object.entries(storeGroups).forEach(([storeId, serials]) => {
      console.log(`  Store ${storeId}: ${serials.length} products`);
      serials.forEach(s => console.log(`    - ${s}`));
    });
    
    // Count products not in user's store
    const wrongStoreProducts = allProducts.filter(p => p.storeId !== userStoreId);
    
    if (wrongStoreProducts.length > 0) {
      console.log(`\n=== Updating ${wrongStoreProducts.length} products to storeId: ${userStoreId} ===`);
      
      const result = await prisma.product.updateMany({
        where: {
          storeId: { not: userStoreId }
        },
        data: { storeId: userStoreId }
      });
      
      console.log(`✓ Updated ${result.count} products`);
    } else {
      console.log('\n✓ All products already have correct storeId');
    }
  } else {
    console.log('No products found in database');
  }
  
  // Check and update items
  console.log('\n=== Checking Items ===');
  const allItems = await prisma.item.findMany({
    select: { id: true, name: true, itemCode: true, storeId: true }
  });
  
  console.log(`Total items: ${allItems.length}`);
  const itemsWrongStore = allItems.filter(i => i.storeId !== userStoreId);
  
  if (itemsWrongStore.length > 0) {
    console.log(`Updating ${itemsWrongStore.length} items one by one...`);
    let updated = 0;
    let skipped = 0;
    
    for (const item of itemsWrongStore) {
      try {
        // Check if item with same itemCode already exists in target store
        const existing = await prisma.item.findUnique({
          where: {
            itemCode_storeId: {
              itemCode: item.itemCode || '',
              storeId: userStoreId
            }
          }
        });
        
        if (existing) {
          console.log(`  ⚠ Skipping ${item.name} (${item.itemCode}) - already exists in target store`);
          skipped++;
        } else {
          await prisma.item.update({
            where: { id: item.id },
            data: { storeId: userStoreId }
          });
          updated++;
        }
      } catch (error) {
        console.log(`  ✗ Error updating ${item.name}: ${error.message}`);
        skipped++;
      }
    }
    
    console.log(`✓ Updated ${updated} items, skipped ${skipped} items`);
  } else {
    console.log('✓ All items have correct storeId');
  }
  
  // Check and update tools
  console.log('\n=== Checking Tools ===');
  const allTools = await prisma.tool.findMany({
    select: { id: true, toolName: true, storeId: true }
  });
  
  console.log(`Total tools: ${allTools.length}`);
  const toolsWrongStore = allTools.filter(t => t.storeId !== userStoreId);
  
  if (toolsWrongStore.length > 0) {
    console.log(`Updating ${toolsWrongStore.length} tools...`);
    const toolResult = await prisma.tool.updateMany({
      where: {
        OR: [
          { storeId: null },
          { storeId: { not: userStoreId } }
        ]
      },
      data: { storeId: userStoreId }
    });
    console.log(`✓ Updated ${toolResult.count} tools`);
  } else {
    console.log('✓ All tools have correct storeId');
  }
  
  console.log('\n✓ All data updated successfully!');
  console.log('Refresh the dashboard to see your data.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
