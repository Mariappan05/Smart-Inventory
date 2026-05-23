# Database Structure Analysis for Store-Based Filtering

## Current Database Structure

### Tables WITH storeId (Already Store-Aware)
1. **User** - Has `storeId` ✓
2. **Product** - Has `storeId` ✓
3. **Schedule** - Has `storeId` ✓
4. **TentativeMonthlySchedule** - Has `storeId` ✓
5. **ProductOutLog** - Has `fromStoreId` ✓
6. **ProductInLog** - Has `toStoreId` ✓
7. **ProductMovementLog** - Has `fromStoreId` and `toStoreId` ✓
8. **ProductMaintenanceLog** - Has `storeId` ✓
9. **QrScanLog** - Has `storeId` ✓
10. **SecurityAlert** - Has `storeId` ✓
11. **Store** - The main store table ✓

### Tables WITHOUT storeId (Need Store Filtering via createdBy)
1. **Item** - Has `createdById` only
2. **Tool** - Has `createdById` only
3. **Supplier** - Has `createdById` only
4. **Type** - Has `createdById` only

### Tables That Don't Need storeId (System-Wide)
1. **UserImage** - User profile images (follows user)
2. **ProductImage** - Product images (follows product)
3. **TentativeMonthlyScheduleItem** - Child of TentativeMonthlySchedule
4. **TentativeMonthlyScheduleItemTool** - Child of TentativeMonthlyScheduleItem
5. **AuditLog** - System-wide audit trail
6. **Notification** - User-specific notifications

## Required Schema Changes

### Add storeId to These Tables:
1. **Item** - Add `storeId` field
2. **Tool** - Add `storeId` field  
3. **Supplier** - Add `storeId` field
4. **Type** - Add `storeId` field

## Store Filtering Logic by Table

### Direct Store Filtering (Has storeId)
```typescript
// Filter by storeId directly
where: {
  storeId: userStoreId // or {} for ADMIN/ADMIN_MANAGER
}
```

**Tables:**
- Product
- Schedule
- TentativeMonthlySchedule
- ProductOutLog (fromStoreId)
- ProductInLog (toStoreId)
- ProductMovementLog (fromStoreId/toStoreId)
- ProductMaintenanceLog
- QrScanLog
- SecurityAlert

### Indirect Store Filtering (Via createdBy.storeId)
```typescript
// Filter by creator's storeId
where: {
  createdBy: {
    storeId: userStoreId
  }
}
```

**Tables (AFTER adding storeId):**
- Item
- Tool
- Supplier
- Type

### No Filtering Needed (Follows Parent)
- UserImage (follows User)
- ProductImage (follows Product)
- TentativeMonthlyScheduleItem (follows TentativeMonthlySchedule)
- TentativeMonthlyScheduleItemTool (follows TentativeMonthlyScheduleItem)
- Notification (user-specific)
- AuditLog (system-wide)

## Access Control Rules

### ADMIN & ADMIN_MANAGER
- Can access ALL stores
- No filtering applied
- `where: {}` (empty where clause)

### STORE_MANAGER, SUB_STORE_LOGIN, INWARD_PERSON, OUTWARD_PERSON, EMPLOYEE
- Can ONLY access their assigned store
- Filter by `storeId: session.storeId`
- Must save `storeId` on create operations

## Data Visibility Matrix

| Module | Table | Filter Field | Admin Access | Store User Access |
|--------|-------|--------------|--------------|-------------------|
| Products | Product | storeId | All | Own Store Only |
| Items | Item | storeId (NEW) | All | Own Store Only |
| Tools | Tool | storeId (NEW) | All | Own Store Only |
| Suppliers | Supplier | storeId (NEW) | All | Own Store Only |
| Types | Type | storeId (NEW) | All | Own Store Only |
| Schedules | Schedule | storeId | All | Own Store Only |
| Monthly Plan | TentativeMonthlySchedule | storeId | All | Own Store Only |
| Inward | ProductInLog | toStoreId | All | Own Store Only |
| Outward | ProductOutLog | fromStoreId | All | Own Store Only |
| Movements | ProductMovementLog | fromStoreId/toStoreId | All | Own Store Only |
| Maintenance | ProductMaintenanceLog | storeId | All | Own Store Only |
| Alerts | SecurityAlert | storeId | All | Own Store Only |
| QR Scans | QrScanLog | storeId | All | Own Store Only |

## Implementation Steps

### Step 1: Update Schema
Add `storeId` to Item, Tool, Supplier, Type tables

### Step 2: Create Migration
Migrate existing data to assign storeId based on createdBy.storeId

### Step 3: Update API Routes
Apply store filtering to all GET endpoints

### Step 4: Update Create Operations
Save storeId on all POST endpoints

### Step 5: Update Repositories
Add store filtering methods

### Step 6: Update Services
Use store-aware repository methods

### Step 7: Update UI Components
Ensure UI respects store boundaries

## Critical Rules

1. **Always save storeId** on create operations
2. **Always save createdById** on create operations
3. **Always filter by storeId** for non-admin users
4. **Never show cross-store data** to store users
5. **Admin/Admin Manager bypass** all store filters

## Example Filtering Code

```typescript
// Get user session
const session = await getUserSession(request);

// Build where clause
const where = canAccessAllStores(session.role) 
  ? {} 
  : { storeId: session.storeId };

// Query with filter
const products = await prisma.product.findMany({ where });
```

## Data Integrity Checks

Before implementing:
1. ✓ Verify all tables have proper indexes on storeId
2. ✓ Verify all foreign keys are correct
3. ✓ Verify createdById is saved everywhere
4. ✓ Verify storeId is saved everywhere
5. ✓ Test with multiple stores
6. ✓ Test admin access
7. ✓ Test store user access
8. ✓ Test cross-store isolation
