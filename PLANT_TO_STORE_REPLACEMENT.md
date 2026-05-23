# Plant to Store Replacement Summary

## Completed Changes

### 1. Profile Page Updates
- ✅ Removed admin-only restriction for store updates
- ✅ All users can now change their store assignment
- ✅ Replaced "Plant" label with "Store" in the UI
- ✅ Updated API to allow all users to update their store

### 2. Global Replacements (via PowerShell script)
The following files were automatically updated:
- ✅ All TypeScript/TSX files in `src/` directory
- ✅ Replaced `type Plant =` with `type Store =`
- ✅ Replaced `Plant[]` with `Store[]`
- ✅ Replaced `plants?:` with `stores?:`
- ✅ Replaced `plants:` with `stores:`
- ✅ Replaced `plants =` with `stores =`
- ✅ Replaced `plants)` with `stores)`
- ✅ Replaced `{ plants }` with `{ stores }`
- ✅ Replaced "Plant Name" with "Store Name"
- ✅ Replaced "plant name" with "store name"
- ✅ Replaced "Plant Location" with "Store Location"
- ✅ Replaced "Plant:" with "Store:"
- ✅ Replaced "assigned plant" with "assigned store"
- ✅ Replaced "plant admin" with "store admin"
- ✅ Replaced "Select plant" with "Select store"
- ✅ Replaced "No Plant" with "No Store"
- ✅ Replaced "plant assignment" with "store assignment"
- ✅ Replaced "Schedule Plant" with "Schedule Store"

### 3. Manual Updates
- ✅ `src/app/schedules/page.tsx` - Renamed `plants` to `stores`
- ✅ `src/app/schedules/tentative/page.tsx` - Renamed `plants` to `stores`
- ✅ `src/components/product/ProductForm.tsx` - Updated label to "Store Name"
- ✅ `src/components/product/ProductDetails.tsx` - Updated label to "Store"
- ✅ `src/components/layout/Topbar.tsx` - Updated search placeholder
- ✅ `src/validations/productSchemas.tsx` - Updated error message
- ✅ `src/views/profile/ProfileView.tsx` - Full update with store dropdown

### 4. Files Updated (29 total)
1. app/api/monthly-schedule/create/route.ts
2. app/api/plants/route.ts
3. app/api/profile/route.ts
4. app/api/schedules/qr-scan/route.ts
5. app/api/schedules/route.ts
6. app/api/store-rooms/route.ts
7. app/api/users/route.ts
8. app/outward/page.tsx
9. app/users/page.tsx
10. app/page.tsx
11. app/schedules/page.tsx
12. app/schedules/tentative/page.tsx
13. components/product/ProductForm.tsx
14. components/product/ProductDetails.tsx
15. components/layout/Topbar.tsx
16. controllers/productController.ts
17. repositories/movementRepository.ts
18. repositories/productRepository.ts
19. repositories/reportRepository.ts
20. repositories/storeRoomRepository.ts
21. repositories/userRepository.ts
22. services/notificationService.ts
23. services/scanService.ts
24. validations/productSchemas.ts
25. views/machine-io/ScanViews.tsx
26. views/profile/ProfileView.tsx
27. views/qr/QRScannerView.tsx
28. views/schedules/CompletedScheduleView.tsx
29. views/schedules/ExpiredScheduleView.tsx
30. views/schedules/FinalScheduleView.tsx
31. views/schedules/QRScanView.tsx
32. views/schedules/ScheduleHubView.tsx
33. views/schedules/TentativeScheduleView.tsx

## Database Schema (NOT Changed)
The following remain as `plant` in the database to maintain data integrity:
- ✅ Table name: `Plant` (Prisma model)
- ✅ Column name: `plantId` (foreign key references)
- ✅ API endpoint: `/api/plants` (backend route)

This is intentional - only user-facing text was changed to "Store".

## Testing Checklist
- [ ] Profile page - verify store dropdown works
- [ ] Profile page - verify all users can change store
- [ ] Schedule pages - verify store selection works
- [ ] Product form - verify store field displays correctly
- [ ] Users page - verify store column shows correctly
- [ ] Search functionality - verify "stores" in placeholder
- [ ] All forms with store dropdowns function correctly

## Notes
- Database schema intentionally kept as `plant` to avoid migration complexity
- All user-facing text now says "Store" instead of "Plant"
- Backend code still uses `plantId` variable names for database consistency
- The `/api/plants` endpoint still exists but serves "stores" data
