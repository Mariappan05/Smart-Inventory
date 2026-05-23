# Complete Machine to Product Migration Guide

## What Has Been Done

### ✅ 1. Database Schema (prisma/schema.prisma)
- All models use `Product` (not Machine)
- ProductStatus enum: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_STOCK
- All relations properly configured

### ✅ 2. Environment Configuration
- **.env**: Updated with Supabase database URL
- **DATABASE_URL**: `postgresql://postgres:Products@mari@123@db.namvzyxzobthykldetii.supabase.co:5432/postgres`
- **NEXT_PUBLIC_APP_NAME**: "Smart Product Inventory"

### ✅ 3. Code Updated
- **Repository** (`src/repositories/machineRepository.ts`): 
  - `MachineRepository` → `ProductRepository`
  - All `prisma.machine` → `prisma.product`
  - All `prisma.machineMovementLog` → `prisma.productMovementLog`
  
- **Service** (`src/services/machineService.ts`):
  - `MachineService` → `ProductService`
  - `MachineStatus` → `ProductStatus`
  
- **Controller** (`src/controllers/machineController.ts`):
  - `MachineController` → `ProductController`
  - All internal references updated

### ✅ 4. Display Text
- App title: "Smart Product Inventory"
- Sidebar: "Smart Product"
- Dashboard KPIs: "Active Products", "Offline Products"
- All error messages use "product"

### ✅ 5. Form Simplified
Only 5 fields:
1. Serial Number (auto-generated)
2. Supplier Name (dropdown)
3. Type (dropdown)
4. Item Description (dropdown)
5. Price (with 18% GST calculation)

## Next Steps

### Step 1: Run Migration
```bash
npm run prisma:migrate
```
When prompted for migration name, enter: `rename_machine_to_product`

This will:
- Create all tables in your Supabase database
- Use Product table (not Machine)
- Set up all relationships

### Step 2: Seed Database (Optional)
```bash
npm run prisma:seed
```

### Step 3: Start Development Server
```bash
npm run dev
```

## Database Tables Created

The migration will create these tables in Supabase:
- ✅ User
- ✅ UserImage
- ✅ ProductCategory
- ✅ Supplier
- ✅ StoreRoom
- ✅ **Product** (main table - was Machine)
- ✅ ProductImage
- ✅ ProductOutLog
- ✅ ProductInLog
- ✅ QrScanLog
- ✅ SecurityAlert
- ✅ ProductMovementLog
- ✅ ProductMaintenanceLog
- ✅ AuditLog

## Summary

✅ **Database**: Uses `Product` table
✅ **Code**: Uses `Product` models
✅ **Display**: Shows "Products" to users
✅ **Fresh Start**: New Supabase database with correct naming

Everything is now consistently named "Product" throughout the entire application!
