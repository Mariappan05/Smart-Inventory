const { PrismaClient } = require('@prisma/client');

async function check() {
  const prisma = new PrismaClient();
  
  try {
    const itemCount = await prisma.item.count();
    const items = await prisma.item.findMany({
      take: 20,
      select: { id: true, name: true, itemCode: true, description: true, _count: { select: { tools: true } } }
    });
    
    const toolCount = await prisma.tool.count();
    const tools = await prisma.tool.findMany({
      take: 10,
      select: { id: true, itemId: true, toolName: true, operations: true, supplierName: true }
    });
    
    console.log('==== DATABASE CHECK ====');
    console.log(`Total Items: ${itemCount}`);
    console.log('\nSample Items:');
    items.forEach(item => {
      console.log(`  - ${item.name} (${item.itemCode}) - Description: ${item.description} - Tools: ${item._count?.tools || 0}`);
    });
    
    console.log(`\nTotal Tools: ${toolCount}`);
    console.log('\nSample Tools:');
    tools.forEach(tool => {
      console.log(`  - ${tool.toolName} for Item: ${tool.itemId}`);
      console.log(`    Operations: ${JSON.stringify(tool.operations)}`);
      console.log(`    Supplier: ${tool.supplierName}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
