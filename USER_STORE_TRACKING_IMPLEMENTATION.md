# User ID & Store ID Tracking - Complete Implementation Plan

## Current Status

### ✅ Already Implemented

#### Schema (Prisma)
- ✅ `createdById` fields added to: Item, Supplier, Product, Tool, Schedule
- ✅ User relations created for all createdBy tracking
- ✅ Database indexes on all createdById fields
- ✅ `plantId` (Store ID) already exists on: User, Product, Schedule, ProductOutLog, ProductInLog, ProductMovementLog

#### Authentication & Permissions
- ✅ JWT token includes: userId, role, name, plantId
- ✅ `canAccessAllStores()` function for Admin/Admin_Manager
- ✅ `getStoreWhereClause()` for Prisma filtering
- ✅ `requireAuth()` middleware for authentication

#### API Routes with User ID Tracking
- ✅ `/api/products` - saves createdById
- ✅ `/api/tools` - saves createdById
- ✅ `/api/items` - saves createdById
- ✅ `/api/suppliers` - saves createdById
- ✅ `/api/schedules` - saves createdById

#### API Routes with Store Filtering
- ✅ `/api/schedules` - filters by plantId
- ✅ `/api/alerts` - filters by plantId
- ✅ `/api/qr/logs` - filters by plantId
- ✅ `/api/reports` - filters by plantId

### ❌ Missing Implementation

#### Schema Updates Needed
1. **TentativeMonthlySchedule** - needs createdById and plantId
2. **Type** - needs createdById (global but track creator)
3. **Plant** - needs createdById (track who created stores)
4. **SecurityAlert** - already has reportedById, needs plantId for filtering
5. **ProductOutLog** - already has outById and fromPlantId ✅
6. **ProductInLog** - already has inById and toPlantId ✅
7. **ProductMovementLog** - already has movedById, fromPlantId, toPlantId ✅
8. **ProductMaintenanceLog** - already has performedById, needs plantId
9. **QrScanLog** - already has scannedById, needs plantId for filtering

#### API Routes Needing Updates

##### High Priority (User-Facing Create Operations)
1. **`/api/machines` (POST)** - ✅ Already saves createdById via controller
2. **`/api/machine-io/in` (POST)** - needs to save inById
3. **`/api/machine-io/scan` (POST)** - needs to save scannedById
4. **`/api/alerts` (POST)** - needs to save reportedById
5. **`/api/monthly-schedule/create` (POST)** - needs createdById and plantId
6. **`/api/types` (POST)** - needs createdById
7. **`/api/plants` (POST)** - needs createdById
8. **`/api/users` (POST)** - already tracks creator in audit logs

##### Medium Priority (List/Filter Operations)
1. **`/api/machines` (GET)** - needs store filtering
2. **`/api/items` (GET)** - global data, no store filter needed
3. **`/api/suppliers` (GET)** - global data, no store filter needed
4. **`/api/tools` (GET)** - global data, no store filter needed
5. **`/api/types` (GET)** - global data, no store filter needed
6. **`/api/monthly-schedule` (GET)** - needs store filtering
7. **`/api/machine-io/logs` (GET)** - needs store filtering

##### Low Priority (Admin Operations)
1. **`/api/plants` (GET)** - Admin only, no filtering needed
2. **`/api/users` (GET)** - Admin only, already filters by plantId

## Implementation Steps

### Step 1: Update Prisma Schema

Add missing fields to models:

```prisma
model TentativeMonthlySchedule {
  // ... existing fields
  plantId       String?
  plant         Plant?   @relation("MonthlySchedulePlant", fields: [plantId], references: [id], onDelete: SetNull)
  createdById   String?
  createdBy     User?    @relation("MonthlyScheduleCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  
  @@index([plantId])
  @@index([createdById])
}

model Type {
  // ... existing fields
  createdById   String?
  createdBy     User?    @relation("TypeCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  
  @@index([createdById])
}

model Plant {
  // ... existing fields
  createdById   String?
  createdBy     User?    @relation("PlantCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  monthlySchedules TentativeMonthlySchedule[] @relation("MonthlySchedulePlant")
  
  @@index([createdById])
}

model ProductMaintenanceLog {
  // ... existing fields
  plantId       String?
  plant         Plant?   @relation("MaintenancePlant", fields: [plantId], references: [id], onDelete: SetNull)
  
  @@index([plantId])
}

model SecurityAlert {
  // ... existing fields
  plantId       String?
  plant         Plant?   @relation("AlertPlant", fields: [plantId], references: [id], onDelete: SetNull)
  
  @@index([plantId])
}

model QrScanLog {
  // ... existing fields
  plantId       String?
  plant         Plant?   @relation("ScanPlant", fields: [plantId], references: [id], onDelete: SetNull)
  
  @@index([plantId])
}

// Update User model to add new relations
model User {
  // ... existing relations
  createdTypes   Type[]                @relation("TypeCreatedBy")
  createdPlants  Plant[]               @relation("PlantCreatedBy")
  createdMonthlySchedules TentativeMonthlySchedule[] @relation("MonthlyScheduleCreatedBy")
}
```

### Step 2: Create Migration SQL

```sql
-- Add createdById to TentativeMonthlySchedule
ALTER TABLE "TentativeMonthlySchedule" ADD COLUMN "createdById" TEXT;
ALTER TABLE "TentativeMonthlySchedule" ADD COLUMN "plantId" TEXT;
CREATE INDEX "TentativeMonthlySchedule_createdById_idx" ON "TentativeMonthlySchedule"("createdById");
CREATE INDEX "TentativeMonthlySchedule_plantId_idx" ON "TentativeMonthlySchedule"("plantId");
ALTER TABLE "TentativeMonthlySchedule" ADD CONSTRAINT "TentativeMonthlySchedule_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TentativeMonthlySchedule" ADD CONSTRAINT "TentativeMonthlySchedule_plantId_fkey" 
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add createdById to Type
ALTER TABLE "Type" ADD COLUMN "createdById" TEXT;
CREATE INDEX "Type_createdById_idx" ON "Type"("createdById");
ALTER TABLE "Type" ADD CONSTRAINT "Type_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add createdById to Plant
ALTER TABLE "Plant" ADD COLUMN "createdById" TEXT;
CREATE INDEX "Plant_createdById_idx" ON "Plant"("createdById");
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add plantId to ProductMaintenanceLog
ALTER TABLE "ProductMaintenanceLog" ADD COLUMN "plantId" TEXT;
CREATE INDEX "ProductMaintenanceLog_plantId_idx" ON "ProductMaintenanceLog"("plantId");
ALTER TABLE "ProductMaintenanceLog" ADD CONSTRAINT "ProductMaintenanceLog_plantId_fkey" 
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add plantId to SecurityAlert
ALTER TABLE "SecurityAlert" ADD COLUMN "plantId" TEXT;
CREATE INDEX "SecurityAlert_plantId_idx" ON "SecurityAlert"("plantId");
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_plantId_fkey" 
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add plantId to QrScanLog
ALTER TABLE "QrScanLog" ADD COLUMN "plantId" TEXT;
CREATE INDEX "QrScanLog_plantId_idx" ON "QrScanLog"("plantId");
ALTER TABLE "QrScanLog" ADD CONSTRAINT "QrScanLog_plantId_fkey" 
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Step 3: Update API Routes

#### Pattern for CREATE Operations

```typescript
import { requireAuth } from "@/lib/auth/permissions";
import { canAccessAllStores } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  const body = await request.json();
  
  // Determine plantId for store-specific data
  const plantId = session.plantId; // Use user's store
  
  const record = await prisma.model.create({
    data: {
      ...body,
      createdById: session.userId,  // Always save creator
      plantId: plantId,              // Save store ID if applicable
    },
  });
  
  return NextResponse.json({ success: true, data: record });
}
```

#### Pattern for GET Operations (Store Filtering)

```typescript
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  // Determine if user can access all stores
  const plantId = canAccessAllStores(session.role) 
    ? undefined 
    : session.plantId;

  const records = await prisma.model.findMany({
    where: {
      ...(plantId && { plantId }), // Filter by store if not admin
    },
  });
  
  return NextResponse.json({ success: true, data: records });
}
```

### Step 4: Specific Route Updates

#### `/api/machine-io/in/route.ts`
```typescript
// Save inById when marking machine as IN
await prisma.productInLog.create({
  data: {
    productId,
    toPlantId: session.plantId,
    inById: session.userId,
    conditionNote,
  },
});
```

#### `/api/machine-io/scan/route.ts`
```typescript
// Save scannedById when scanning QR
await prisma.qrScanLog.create({
  data: {
    productId,
    scannedById: session.userId,
    plantId: session.plantId,
    source: "MOBILE",
  },
});
```

#### `/api/alerts/route.ts`
```typescript
// Save reportedById when creating alert
await prisma.securityAlert.create({
  data: {
    productId,
    reportedById: session.userId,
    plantId: session.plantId,
    severity,
    title,
    description,
  },
});
```

#### `/api/monthly-schedule/create/route.ts`
```typescript
// Save createdById and plantId
const schedule = await prisma.tentativeMonthlySchedule.create({
  data: {
    customerName,
    createdById: session.userId,
    plantId: session.plantId,
  },
});
```

#### `/api/types/route.ts`
```typescript
// Save createdById (global data, no plantId)
const type = await prisma.type.create({
  data: {
    name,
    supplierId,
    createdById: session.userId,
  },
});
```

#### `/api/plants/route.ts`
```typescript
// Save createdById when creating store
const plant = await prisma.plant.create({
  data: {
    name,
    code,
    createdById: session.userId,
  },
});
```

#### `/api/machines/route.ts` (GET)
```typescript
// Add store filtering to machine listing
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  const plantId = canAccessAllStores(session.role) 
    ? undefined 
    : session.plantId;

  const machines = await prisma.product.findMany({
    where: {
      ...(plantId && { plantId }),
    },
  });
  
  return NextResponse.json({ success: true, data: machines });
}
```

## Data Access Rules Summary

### Store-Specific Data (Filtered by plantId)
- ✅ Product (Machines)
- ✅ Schedule
- ✅ ProductOutLog
- ✅ ProductInLog
- ✅ ProductMovementLog
- ✅ SecurityAlert (after update)
- ✅ QrScanLog (after update)
- ✅ ProductMaintenanceLog (after update)
- ✅ TentativeMonthlySchedule (after update)

### Global Data (No Store Filter, but track creator)
- ✅ Item
- ✅ Supplier
- ✅ Tool
- ✅ Type
- ✅ Plant (Admin only)
- ✅ User (Admin only)

### Role-Based Access
- **Admin & Admin_Manager**: Access ALL stores (plantId = undefined in queries)
- **All Other Roles**: Access ONLY their assigned store (plantId = session.plantId)

## Testing Checklist

### Create Operations
- [ ] Products - saves createdById and plantId
- [ ] Tools - saves createdById
- [ ] Schedules - saves createdById and plantId
- [ ] Inward - saves inById and toPlantId
- [ ] Outward - saves outById and fromPlantId
- [ ] Suppliers - saves createdById
- [ ] Machines - saves createdById and plantId
- [ ] Alerts - saves reportedById and plantId
- [ ] Monthly Schedule - saves createdById and plantId
- [ ] Types - saves createdById
- [ ] Plants - saves createdById

### List Operations (Store Filtering)
- [ ] Admin sees all stores' data
- [ ] Admin_Manager sees all stores' data
- [ ] Store_Manager sees only their store's data
- [ ] Employee sees only their store's data
- [ ] Other roles see only their store's data

### Specific Tests
- [ ] Create machine in Store A, verify Store B user cannot see it
- [ ] Create schedule in Store A, verify Store B user cannot see it
- [ ] Admin can see machines from all stores
- [ ] Inward operation saves correct user ID and store ID
- [ ] Outward operation saves correct user ID and store ID
- [ ] QR scan saves correct user ID and store ID
- [ ] Alert creation saves correct user ID and store ID

## Deployment Steps

1. **Stop the application**
   ```bash
   # Stop dev server (Ctrl+C)
   ```

2. **Update schema and run migration**
   ```bash
   npx prisma migrate dev --name add_user_store_tracking
   npx prisma generate
   ```

3. **Update API routes** (as per Step 4 above)

4. **Restart application**
   ```bash
   npm run dev
   ```

5. **Test all create and list operations**

6. **Verify store filtering works correctly**

## Notes

- User ID tracking is for audit purposes (who created what)
- Store ID tracking is for data isolation (who can see what)
- Admin roles bypass store filtering for management purposes
- All existing operation-specific user tracking (outById, inById, etc.) remains unchanged
- Global data (Items, Suppliers, Tools, Types) is shared across stores but tracks creator
