# Quick Reference - Store Filtering & User Tracking

## 🚀 Quick Start

### Run Migration (REQUIRED)
```bash
npx prisma migrate dev --name add_user_store_tracking
npx prisma generate
npm run dev
```

## 📝 Code Patterns

### 1. Authentication in API Routes
```typescript
import { requireAuth, canAccessAllStores } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult; // { userId, role, plantId }
  
  // Your code here
}
```

### 2. Store Filtering (GET/List)
```typescript
// Determine plantId based on role
const plantId = canAccessAllStores(session.role) 
  ? undefined  // Admin sees all
  : session.plantId;  // Others see only their store

// Apply filter in query
const data = await prisma.model.findMany({
  where: plantId ? { plantId } : {},
});
```

### 3. Save User & Store (POST/Create)
```typescript
const record = await prisma.model.create({
  data: {
    ...body,
    createdById: session.userId,  // Save user ID
    plantId: session.plantId,      // Save store ID (if store-specific)
  },
});
```

### 4. Using Store Filter Helper
```typescript
import { getStoreWhereClause } from "@/lib/storeFilter";

const where = {
  ...getStoreWhereClause(session),
  // other conditions
};
```

## 🗂️ Data Classification

### Store-Specific (Filter by plantId)
```typescript
// These need plantId filtering
Product, Schedule, SecurityAlert, QrScanLog,
ProductOutLog, ProductInLog, ProductMovementLog,
ProductMaintenanceLog, TentativeMonthlySchedule
```

### Global (No plantId filter)
```typescript
// These are shared across stores
Item, Supplier, Tool, Type, Plant, User
// But still track createdById!
```

## 🔑 Key Functions

### Check if user can access all stores
```typescript
import { canAccessAllStores } from "@/lib/auth/permissions";

if (canAccessAllStores(session.role)) {
  // Admin or Admin_Manager
  // Can see all stores
} else {
  // Other roles
  // Can see only their store
}
```

### Get store filter clause
```typescript
import { getStoreWhereClause } from "@/lib/storeFilter";

const where = {
  ...getStoreWhereClause(session),
};
// Returns: { plantId: session.plantId } or {}
```

### Get current user session
```typescript
import { getUserSession } from "@/lib/auth/permissions";

const session = await getUserSession(request);
// Returns: { userId, role, plantId } or null
```

## 📊 Database Fields

### User Tracking Fields
```typescript
createdById: String?  // Who created this record
```

### Store Tracking Fields
```typescript
plantId: String?  // Which store owns this record
```

### Operation Tracking Fields
```typescript
scannedById: String?   // Who scanned QR
inById: String?        // Who marked IN
outById: String?       // Who marked OUT
movedById: String?     // Who moved
reportedById: String?  // Who reported alert
performedById: String? // Who performed maintenance
```

## 🎯 Common Scenarios

### Scenario 1: List with Store Filter
```typescript
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  const plantId = canAccessAllStores(session.role) 
    ? undefined 
    : session.plantId;

  const items = await prisma.product.findMany({
    where: plantId ? { plantId } : {},
  });

  return NextResponse.json({ success: true, data: items });
}
```

### Scenario 2: Create with User & Store
```typescript
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  const body = await request.json();

  const item = await prisma.product.create({
    data: {
      ...body,
      createdById: session.userId,
      plantId: session.plantId,
    },
  });

  return NextResponse.json({ success: true, data: item });
}
```

### Scenario 3: Global Data (No Store Filter)
```typescript
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  // Items are global - no plantId filter
  const items = await prisma.item.findMany();

  return NextResponse.json({ success: true, data: items });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  const body = await request.json();

  // Items are global - no plantId, but track creator
  const item = await prisma.item.create({
    data: {
      ...body,
      createdById: session.userId,  // Track who created
      // NO plantId - items are shared
    },
  });

  return NextResponse.json({ success: true, data: item });
}
```

## 🧪 Testing Commands

### Check User's Store
```sql
SELECT id, name, email, role, "plantId" 
FROM "User" 
WHERE email = 'user@example.com';
```

### Check Store Filtering
```sql
-- Chennai store products
SELECT id, serial, "plantId" 
FROM "Product" 
WHERE "plantId" = 'chennai-store-id';

-- Madurai store products
SELECT id, serial, "plantId" 
FROM "Product" 
WHERE "plantId" = 'madurai-store-id';
```

### Check User Tracking
```sql
-- Who created what
SELECT id, name, "createdById", "createdAt" 
FROM "Item" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

## ⚠️ Common Mistakes

### ❌ DON'T: Forget to filter by store
```typescript
// BAD - Shows all stores
const items = await prisma.product.findMany();
```

### ✅ DO: Always filter by store
```typescript
// GOOD - Shows only user's store
const plantId = canAccessAllStores(session.role) 
  ? undefined 
  : session.plantId;
const items = await prisma.product.findMany({
  where: plantId ? { plantId } : {},
});
```

### ❌ DON'T: Forget to save user ID
```typescript
// BAD - No audit trail
const item = await prisma.product.create({
  data: { ...body },
});
```

### ✅ DO: Always save user ID
```typescript
// GOOD - Complete audit trail
const item = await prisma.product.create({
  data: {
    ...body,
    createdById: session.userId,
  },
});
```

### ❌ DON'T: Filter global data by store
```typescript
// BAD - Items are global
const items = await prisma.item.findMany({
  where: { plantId: session.plantId }, // plantId doesn't exist!
});
```

### ✅ DO: Don't filter global data
```typescript
// GOOD - Items are shared across stores
const items = await prisma.item.findMany();
```

## 📞 Quick Help

### Issue: "Unknown argument `createdById`"
```bash
npx prisma generate
# Restart dev server
```

### Issue: "Unknown argument `plantId`"
```bash
npx prisma migrate dev --name add_user_store_tracking
npx prisma generate
# Restart dev server
```

### Issue: Users see other stores' data
Check your filter:
```typescript
const plantId = canAccessAllStores(session.role) 
  ? undefined 
  : session.plantId;
```

## 📚 Full Documentation

- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment
- `STORE_FILTERING_STATUS.md` - Module-by-module status
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `EXECUTIVE_SUMMARY.md` - High-level overview

---

**Keep this card handy when developing new features!**
