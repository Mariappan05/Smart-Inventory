const { PrismaClient } = require('@prisma/client');

async function addTools() {
  const prisma = new PrismaClient();
  
  try {
    // Find a Gear component for ABC Industries
    const gearComponent = await prisma.item.findFirst({
      where: {
        name: 'Gear',
        description: 'PRODUCT_ABC Industries'
      }
    });
    
    if (!gearComponent) {
      console.log('No Gear component found for ABC Industries');
      return;
    }
    
    console.log(`Found Gear component: ${gearComponent.id} - ${gearComponent.name}`);
    
    // Add tools with operations to this component
    const tool1 = await prisma.tool.create({
      data: {
        itemId: gearComponent.id,
        toolName: 'Grinding Wheel',
        operations: JSON.stringify([
          { name: 'Roughing', lifeSpan: 50 },
          { name: 'Finishing', lifeSpan: 100 }
        ]),
        supplierName: 'Premium Tools Ltd',
        supplierCode: 'PT-001',
        rate: 500,
        storeId: 'cmpconytk0000ei34uo1j9d9i' // Chennai store
      }
    });
    
    const tool2 = await prisma.tool.create({
      data: {
        itemId: gearComponent.id,
        toolName: 'Lathe Cutter',
        operations: JSON.stringify([
          { name: 'Threading', lifeSpan: 75 }
        ]),
        supplierName: 'Premium Tools Ltd',
        supplierCode: 'PT-002',
        rate: 350,
        storeId: 'cmpconytk0000ei34uo1j9d9i' // Chennai store
      }
    });
    
    console.log('Added tools:');
    console.log(`  - ${tool1.toolName}`);
    console.log(`  - ${tool2.toolName}`);
    console.log('✅ Tools added successfully');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addTools();
