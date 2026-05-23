# Database Schema Update: Plant → Store Renaming

## Summary
This update renames the `Plant` table to `Store` and updates all related foreign key columns from `plantId` to `storeId` throughout the entire codebase for consistency with the UI terminology.

## Database Changes

### Migration File Created
- **Location**: `prisma/migrations/20260520000000_rename_plant_to_store/migration.sql`
- **Purpose**: Renames Plant table to Store and updates all foreign key columns

### Schema Changes (schema.prisma)
1. **Model Renamed**: `Plant` → `Store`
2. **Foreign Key Columns Updated**:
   - `User.plantId` → `User.storeId`
   - `Product.plantId` → `Product.storeId`
   - `ProductOutLog.fromPlantId` → `ProductOutLog.fromStoreId`
   - `ProductInLog.toPlantId` → `ProductInLog.toStoreId`
   - `QrScanLog.plantId` → `QrScanLog.storeId`
   - `SecurityAlert.plantId` → `SecurityAlert.storeId`
   - `ProductMovementLog.fromPlantId` → `ProductMovementLog.fromStoreId`
   - `ProductMovementLog.toPlantId` → `ProductMovementLog.toStoreId`
   - `ProductMaintenanceLog.plantId` → `ProductMaintenanceLog.storeId`
   - `Schedule.plantId` → `Schedule.storeId`
   - `Schedule.completedByPlantId` → `Schedule.completedByStoreId`
   - `TentativeMonthlySchedule.plantId` → `TentativeMonthlySchedule.storeId`

3. **Relation Names Updated**:
   - `UserPlant` → `UserStore`
   - `PlantCreatedBy` → `StoreCreatedBy`
   - `ScheduleCompletedByPlant` → `ScheduleCompletedByStore`
   - `MonthlySchedulePlant` → `MonthlyScheduleStore`
   - `MaintenancePlant` → `MaintenanceStore`
   - `AlertPlant` → `AlertStore`
   - `ScanPlant` → `ScanStore`

## Code Changes

### API Routes Updated
1. **`src/app/api/plants/route.ts`**
   - Changed `prisma.plant` to `prisma.store`
   - Updated error messages from "plant" to "store"

2. **`src/app/api/plants/[id]/route.ts`**
   - Changed `prisma.plant` to `prisma.store`
   - Updated error messages

3. **`src/app/api/users/route.ts`**
   - Changed `plantId` to `storeId` in request body
   - Updated validation messages
   - Changed relation from `Store` to `store` in Prisma create

4. **`src/app/api/schedules/route.ts`**
   - Changed `plantId` to `storeId` throughout
   - Updated `plant` to `store` in includes
   - Changed `completedByPlant` to `completedByStore`
   - Updated notification function calls

### Page Components Updated
1. **`src/app/stores/page.tsx`**
   - Changed `prisma.plant` to `prisma.store`

2. **`src/app/users/page.tsx`**
   - Changed `plantId` to `storeId`
   - Changed `plant` to `store` in select
   - Changed `prisma.plant` to `prisma.store`

3. **`src/app/schedules/page.tsx`**
   - Changed `prisma.plant` to `prisma.store`

### View Components Updated
1. **`src/views/users/UsersView.tsx`**
   - Changed `plantId` to `storeId` in UserType
   - Changed `plant` to `store` in UserType
   - Updated form state from `plantId` to `storeId`
   - Updated all references in JSX

2. **`src/views/schedules/TentativeScheduleView.tsx`**
   - Changed `Store: Plant` to `store: Store` in Schedule type
   - Changed `plants` prop to `stores`
   - Changed `selectedPlant` to `selectedStore`
   - Changed `plantId` to `storeId` in API calls
   - Updated all display references

### Library Files Updated
1. **`src/lib/storeFilter.ts`**
   - Changed `plantId` to `storeId` in all functions
   - Updated function parameters

2. **`src/lib/auth/permissions.ts`**
   - Changed `plantId` to `storeId` in UserSession type

3. **`src/lib/auth/jwt.ts`**
   - Changed `plantId` to `storeId` in AuthTokenPayload type

4. **`src/services/authService.ts`**
   - Changed `plantId` to `storeId` in JWT token generation

## Migration Instructions

### Step 1: Apply Migration
Run the migration to rename the table and columns:
```bash
npx prisma migrate deploy
```

### Step 2: Generate Prisma Client
Generate the updated Prisma client:
```bash
npx prisma generate
```

### Step 3: Restart Application
Restart the Next.js development server:
```bash
npm run dev
```

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] Prisma client generated without errors
- [ ] Users page loads and displays store information
- [ ] Stores management page works correctly
- [ ] Schedule creation uses storeId correctly
- [ ] User creation with store assignment works
- [ ] Authentication includes storeId in JWT token
- [ ] Store filtering works for non-admin users
- [ ] All API endpoints respond correctly

## Notes

- The migration preserves all existing data
- All indexes are renamed to match new column names
- Foreign key constraints remain intact
- The API route path `/api/plants` remains unchanged for backward compatibility
- UI already displayed "Store" terminology, now database matches

## Rollback Plan

If issues occur, the migration can be rolled back by:
1. Reverting the schema.prisma changes
2. Running: `npx prisma migrate resolve --rolled-back 20260520000000_rename_plant_to_store`
3. Reverting all code changes
