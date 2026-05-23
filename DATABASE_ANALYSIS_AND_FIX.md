# Database Analysis & Store Filtering Issue Diagnosis

## 🔍 Database Structure Analysis

### Key Tables & Relationships

#### 1. User Table
```
User {
  id: String (PK)
  plantId: String? (FK → Plant.id) ← USER'S ASSIGNED STORE
  role: UserRole
  ...
}
```

#### 2. Product Table (Machines in UI)
```
Product {
  id: String (PK)
  plantId: String (FK → Plant.id) ← PRODUCT'S STORE (REQUIRED)
  createdById: String? (FK → User.id)
  serial: String
  ...
}
```

#### 3. Plant Table (Stores)
```
Plant {
  id: String (PK)
  name: String
  code: String
  ...
}
```

### Relationships
- `User.plantId` → `Plant.id` (User's assigned store)
- `Product.plantId` → `Plant.id` (Product's store - REQUIRED)
- `Product.createdById` → `User.id` (Who created the product)

## 🐛 Issue Identified

### Problem Statement
**Products created by Chennai Store Admin are visible to other Store users**

### Root Cause Analysis

#### Issue #1: Null plantId Handling
```typescript
// In productController.listProducts()
const plantId = user && !canAccessAllStores(user.role as any) 
  ? user.plantId  // ← This can be NULL from database
  : undefined;

// When user.plantId is NULL:
// plantId = null → converted to undefined → shows ALL stores
```

**Problem**: When `user.plantId` is `null` (not assigned in database), it becomes `undefined`, which means "no filter" = show all stores.

#### Issue #2: Users Without Assigned Store
If users don't have `plantId` set in the database:
```sql
SELECT id, name, email, role, "plantId" FROM "User";
-- If plantId is NULL for non-admin users → they see ALL stores
```

#### Issue #3: Inconsistent Filtering Logic
Some places check `plantId || undefined`, others check `plantId ? { plantId } : {}`

## ✅ Solution

### Fix #1: Strict Null Checking
```typescript
// BEFORE (WRONG)
const plantId = user && !canAccessAllStores(user.role as any) 
  ? user.plantId  // Can be null
  : undefined;

// AFTER (CORRECT)
const plantId = canAccessAllStores(user.role) 
  ? undefined  // Admin sees all
  : (user.plantId || null);  // Others MUST have plantId

// Then validate
if (!canAccessAllStores(user.role) && !plantId) {
  return error("User not assigned to any store");
}
```

### Fix #2: Database Validation
Ensure all non-admin users have `plantId` assigned:
```sql
-- Check users without plantId
SELECT id, name, email, role, "plantId" 
FROM "User" 
WHERE role NOT IN ('ADMIN', 'ADMIN_MANAGER') 
AND "plantId" IS NULL;

-- These users MUST be assigned to a store
```

### Fix #3: Consistent Filter Pattern
```typescript
// Pattern for ALL queries
const where: Prisma.ProductWhereInput = {};

if (!canAccessAllStores(session.role)) {
  if (!session.plantId) {
    throw new Error("User not assigned to any store");
  }
  where.plantId = session.plantId;
}

const products = await prisma.product.findMany({ where });
```

## 📊 Store Filtering Matrix

### Table: Product (Machines)
| Field | Type | Purpose | Filter By |
|-------|------|---------|-----------|
| plantId | String (REQUIRED) | Product's store | ✅ YES |
| createdById | String? | Who created | ❌ NO (audit only) |

**Filtering Logic**:
- Filter by `Product.plantId` = `User.plantId`
- NOT by `Product.createdById`

### Table: Schedule
| Field | Type | Purpose | Filter By |
|-------|------|---------|-----------|
| plantId | String (REQUIRED) | Schedule's store | ✅ YES |
| createdById | String? | Who created | ❌ NO (audit only) |

**Filtering Logic**:
- Filter by `Schedule.plantId` = `User.plantId`
- NOT by `Schedule.createdById`

### Table: SecurityAlert
| Field | Type | Purpose | Filter By |
|-------|------|---------|-----------|
| plantId | String? | Alert's store | ✅ YES |
| reportedById | String? | Who reported | ❌ NO (audit only) |
| productId | String | Related product | ✅ YES (via Product.plantId) |

**Filtering Logic**:
- Filter by `SecurityAlert.plantId` = `User.plantId`
- OR filter by `SecurityAlert.product.plantId` = `User.plantId`

### Table: QrScanLog
| Field | Type | Purpose | Filter By |
|-------|------|---------|-----------|
| plantId | String? | Scan's store | ✅ YES |
| scannedById | String? | Who scanned | ❌ NO (audit only) |
| productId | String | Scanned product | ✅ YES (via Product.plantId) |

**Filtering Logic**:
- Filter by `QrScanLog.plantId` = `User.plantId`
- OR filter by `QrScanLog.product.plantId` = `User.plantId`

## 🔧 Implementation Fixes Needed

### 1. Update productController.listProducts()
```typescript
async listProducts(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Determine plantId for filtering
    let plantId: string | undefined = undefined;
    
    if (!canAccessAllStores(user.role as any)) {
      // Non-admin users MUST have plantId
      if (!user.plantId) {
        return NextResponse.json(
          { success: false, message: "User not assigned to any store. Please contact administrator." },
          { status: 403 }
        );
      }
      plantId = user.plantId;
    }

    const result = await productService.search(search, { page, pageSize }, plantId);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
```

### 2. Update productRepository.search()
```typescript
async search(term: string, options: PageOptions = {}, plantId?: string): Promise<PageResult<Product>> {
  const { page, pageSize, skip, take } = this.getPagination(options);
  
  // Build where clause
  const where: Prisma.ProductWhereInput = {
    AND: [
      // Store filter (if plantId provided)
      ...(plantId ? [{ plantId }] : []),
      // Search filter
      {
        OR: [
          { serial: { contains: term, mode: "insensitive" } },
          { item: { name: { contains: term, mode: "insensitive" } } },
        ],
      }
    ]
  };

  try {
    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({ 
        where, 
        skip, 
        take, 
        orderBy: { createdAt: "desc" },
        include: {
          images: true,
          type: true,
          item: true,
          supplier: true,
          plant: true
        }
      }),
      prisma.product.count({ where }),
    ]);

    return this.buildPageResult(data, total, page, pageSize);
  } catch (error) {
    throw toRepositoryError(error, "Failed to search products");
  }
}
```

### 3. Update productRepository.paginate()
```typescript
async paginate(options: PageOptions = {}, plantId?: string): Promise<PageResult<Product>> {
  const { page, pageSize, skip, take } = this.getPagination(options);

  // Build where clause - ONLY filter by plantId if provided
  const where: Prisma.ProductWhereInput = plantId ? { plantId } : {};

  try {
    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({ 
        where,
        skip, 
        take, 
        orderBy: { createdAt: "desc" },
        include: {
          images: true,
          type: true,
          item: true,
          supplier: true,
          plant: true
        }
      }),
      prisma.product.count({ where }),
    ]);

    return this.buildPageResult(data, total, page, pageSize);
  } catch (error) {
    throw toRepositoryError(error, "Failed to paginate products");
  }
}
```

## 🧪 Testing Scenarios

### Scenario 1: User Without plantId
```
User: { id: "user1", role: "EMPLOYEE", plantId: null }
Expected: Error "User not assigned to any store"
Actual: Shows ALL products (BUG)
```

### Scenario 2: Chennai Store User
```
User: { id: "user1", role: "EMPLOYEE", plantId: "chennai-001" }
Expected: Shows ONLY products where plantId = "chennai-001"
Actual: Should work correctly
```

### Scenario 3: Madurai Store User
```
User: { id: "user2", role: "STORE_MANAGER", plantId: "madurai-001" }
Expected: Shows ONLY products where plantId = "madurai-001"
Actual: Should work correctly
```

### Scenario 4: Admin User
```
User: { id: "admin1", role: "ADMIN", plantId: null }
Expected: Shows ALL products from ALL stores
Actual: Should work correctly
```

## 📝 Verification Queries

### Check User Store Assignments
```sql
-- Find users without plantId (non-admin)
SELECT id, name, email, role, "plantId" 
FROM "User" 
WHERE role NOT IN ('ADMIN', 'ADMIN_MANAGER') 
AND "plantId" IS NULL;
```

### Check Product Store Assignments
```sql
-- All products with their stores
SELECT p.id, p.serial, p."plantId", pl.name as store_name, p."createdById"
FROM "Product" p
LEFT JOIN "Plant" pl ON p."plantId" = pl.id
ORDER BY p."createdAt" DESC;
```

### Check Store Filtering
```sql
-- Products for Chennai store
SELECT p.id, p.serial, pl.name as store_name
FROM "Product" p
JOIN "Plant" pl ON p."plantId" = pl.id
WHERE p."plantId" = 'chennai-store-id';

-- Products for Madurai store
SELECT p.id, p.serial, pl.name as store_name
FROM "Product" p
JOIN "Plant" pl ON p."plantId" = pl.id
WHERE p."plantId" = 'madurai-store-id';
```

## ✅ Action Items

1. **Fix productController.listProducts()** - Add null check for plantId
2. **Fix productRepository.search()** - Ensure proper where clause
3. **Fix productRepository.paginate()** - Ensure proper where clause
4. **Verify User Assignments** - Ensure all non-admin users have plantId
5. **Test Store Isolation** - Verify Chennai/Madurai separation
6. **Apply Same Pattern** - To all other modules (schedules, alerts, etc.)

## 🎯 Key Principle

**ALWAYS filter by the STORE ID field (plantId), NOT by the creator ID (createdById)**

- `plantId` = Which store owns this data
- `createdById` = Who created this data (audit trail only)

**Example**:
- Chennai Admin creates a product → `plantId` = Chennai, `createdById` = Chennai Admin
- Madurai users should NOT see it because `plantId` ≠ Madurai
- Chennai users SHOULD see it because `plantId` = Chennai
- It doesn't matter WHO created it, only WHERE it belongs
