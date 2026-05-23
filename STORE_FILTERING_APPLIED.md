# Store Filtering Applied to All Pages

## Summary
All pages and API endpoints now properly filter data based on the user's assigned `storeId`. This ensures complete data isolation between stores.

## Changes Made

### 1. Dashboard (✓ Fixed)
**File**: `src/repositories/productRepository.ts`
- Fixed `SecurityAlert` filter from `product: { storeId }` to direct `storeId`
- Fixed `QrScanLog` filter from `product: { storeId }` to direct `storeId`
- All dashboard sections now correctly filter by user's store:
  - Product Entry
  - Tool Entry
  - Tentative Schedules
  - Final Schedules
  - Inward Process
  - Outward Process

### 2. Reports (✓ Fixed)
**Files**: 
- `src/controllers/reportController.ts`
- `src/repositories/reportRepository.ts`

**Changes**:
- Updated all report methods to use `storeId` instead of `plantId`
- Machine Report: Filters by `storeId`
- Movement Report: Filters by `fromStoreId` OR `toStoreId`
- Security Alert Report: Filters by `storeId`
- Employee Activity Report: Filters by `storeId`

### 3. Alerts (✓ Fixed)
**Files**:
- `src/controllers/alertController.ts`
- `src/services/alertService.ts`
- `src/repositories/alertRepository.ts`

**Changes**:
- Updated all alert methods to use `storeId` instead of `plantId`
- Create alert: Uses `session.storeId`
- Get alerts: Filters by `storeId`
- Open alerts: Filters by `storeId`
- Recent alerts: Filters by `storeId`

### 4. Monthly Schedule (✓ Fixed)
**File**: `src/app/api/monthly-schedule/route.ts`

**Changes**:
- Fixed import to use `@/lib/storeFiltering` instead of `@/lib/storeFilter`
- Fixed response to use `store` instead of `plant`

### 5. Already Implemented (✓ Verified)
The following modules already have proper store filtering:

- **Products** (`src/app/api/products/route.ts`)
  - GET: Filters by `storeId`
  - POST: Creates with user's `storeId`

- **Tools** (`src/app/api/tools/route.ts`)
  - GET: Filters by `storeId`
  - POST: Creates with user's `storeId`

- **Items** (`src/app/api/items/route.ts`)
  - GET: Filters by `storeId`
  - POST: Creates with user's `storeId`

- **Suppliers** (`src/app/api/suppliers/route.ts`)
  - GET: Filters by `storeId`
  - POST: Creates with user's `storeId`

- **Types** (`src/app/api/types/route.ts`)
  - GET: Filters by `storeId`
  - POST: Creates with user's `storeId`

- **Schedules** (`src/app/api/schedules/route.ts`)
  - GET: Filters by `storeId`
  - POST: Creates with user's `storeId`

## Store Filtering Architecture

### Core Utilities
**File**: `src/lib/storeFiltering.ts`

Provides comprehensive store filtering functions:
- `getStoreWhereClause()` - Direct store filtering
- `getFromStoreWhereClause()` - For outward logs
- `getToStoreWhereClause()` - For inward logs
- `getMovementStoreWhereClause()` - For movement logs (both directions)
- `canUserAccessStore()` - Access validation
- `getStoreIdForCreate()` - Store ID for create operations

### Database Schema
All relevant tables have `storeId` field:
- `Product` - storeId
- `Item` - storeId
- `Tool` - storeId
- `Supplier` - storeId
- `Type` - storeId
- `Schedule` - storeId
- `SecurityAlert` - storeId
- `QrScanLog` - storeId
- `ProductInLog` - toStoreId
- `ProductOutLog` - fromStoreId
- `ProductMovementLog` - fromStoreId, toStoreId

## Testing Checklist

### Dashboard
- [ ] Product Entry count shows only user's store products
- [ ] Tool Entry count shows only user's store tools
- [ ] Tentative Schedules shows only user's store schedules
- [ ] Final Schedules shows only user's store schedules
- [ ] Inward Process shows only logs TO user's store
- [ ] Outward Process shows only logs FROM user's store
- [ ] Recent Records filtered by store
- [ ] Activity Feed filtered by store
- [ ] Alerts filtered by store

### Product Entry Page
- [ ] List shows only user's store products
- [ ] Create assigns to user's store
- [ ] Cannot see products from other stores

### Tool Entry Page
- [ ] List shows only user's store tools
- [ ] Create assigns to user's store
- [ ] Cannot see tools from other stores

### Schedules Pages
- [ ] Tentative schedules filtered by store
- [ ] Final schedules filtered by store
- [ ] Create assigns to user's store

### Reports Page
- [ ] Machine report filtered by store
- [ ] Movement report filtered by store
- [ ] Alert report filtered by store
- [ ] Employee activity report filtered by store

### Alerts Page
- [ ] List shows only user's store alerts
- [ ] Create assigns to user's store

## Security Notes

1. **Strict Store Isolation**: All users can ONLY access data from their assigned store
2. **No Role Exceptions**: Even admins are restricted to their assigned store (except for Users and Stores management)
3. **Create Operations**: All create operations automatically assign the user's `storeId`
4. **Validation**: Server-side validation ensures users cannot access other stores' data

## Migration Notes

All references to `plantId` have been replaced with `storeId`:
- Controllers updated
- Services updated
- Repositories updated
- Database queries updated

## Next Steps

1. Test all pages with multiple users from different stores
2. Verify data isolation is working correctly
3. Test edge cases (user without store assignment)
4. Verify all CRUD operations respect store boundaries
