# Role-Based Access Control (RBAC) Implementation

## Overview
Implemented comprehensive role-based access control to restrict permissions between ADMIN and EMPLOYEE roles.

## Access Control Rules

### ADMIN Role
**Full Access** - Can create, read, update, and delete all resources:
- ✅ Dashboard (view)
- ✅ Products (create, edit, delete, view)
- ✅ Product IN/OUT (full access)
- ✅ Alerts (view)
- ✅ Reports (view, export)
- ✅ Users (create, view)
- ✅ Suppliers (create, view)
- ✅ Types/Categories (create, view)
- ✅ Items (create, view)
- ✅ Plants/Store Rooms (create, view)
- ✅ Profile (edit own)

### EMPLOYEE Role
**Limited Access** - View-only for most pages, full access only to Product IN/OUT:
- ✅ Dashboard (view only)
- ✅ Products (view only - no create/edit/delete)
- ✅ **Product IN/OUT (FULL ACCESS)** - Can scan and process products
- ✅ Alerts (view only)
- ❌ Reports (no access)
- ❌ Users (no access)
- ❌ Suppliers (no access)
- ❌ Types/Categories (no access)
- ❌ Items (no access)
- ❌ Plants/Store Rooms (no access)
- ✅ Profile (edit own)

## Implementation Details

### 1. Frontend Access Control

#### Custom Hook: `useUserRole`
**Location**: `src/hooks/useUserRole.ts`

```typescript
const { role, isAdmin, isEmployee, loading } = useUserRole();
```

Used in all views to conditionally render create/edit/delete buttons.

#### Updated Views
All views now check user role before showing action buttons:

1. **UsersView** (`src/views/users/UsersView.tsx`)
   - "Add User" button only visible to admins

2. **CategoriesView** (`src/views/categories/CategoriesView.tsx`)
   - "Add Category" button only visible to admins

3. **SuppliersView** (`src/views/suppliers/SuppliersView.tsx`)
   - "Add Supplier" button only visible to admins

4. **StoreRoomsView** (`src/views/store-rooms/StoreRoomsView.tsx`)
   - "Add Store Room" button only visible to admins

5. **ProductList** (`src/components/product/ProductList.tsx`)
   - "Add Product" button only visible to admins
   - Edit and Delete buttons only visible to admins
   - View button visible to all authenticated users

#### Sidebar Navigation
**Location**: `src/components/layout/Sidebar.tsx`

Already implements role-based filtering:
- Each menu item has a `roles` array
- Only items matching user's role are displayed

### 2. Backend Access Control

#### Permission Utilities
**Location**: `src/lib/auth/permissions.ts`

Three main functions:
- `getUserSession(request)` - Extract user session from JWT token
- `requireAuth(request)` - Require any authenticated user
- `requireAdmin(request)` - Require admin role specifically

#### Protected API Routes

##### Admin-Only Routes (POST/PUT/DELETE)
These routes require admin role for modifications:

1. **Users API** (`src/app/api/users/route.ts`)
   - GET: Requires auth (any role)
   - POST: Requires admin

2. **Categories API** (`src/app/api/categories/route.ts`)
   - GET: Requires auth
   - POST: Requires admin

3. **Suppliers API** (`src/app/api/suppliers/route.ts`)
   - GET: Requires auth
   - POST: Requires admin

4. **Store Rooms API** (`src/app/api/store-rooms/route.ts`)
   - GET: Requires auth
   - POST: Requires admin

5. **Products/Machines API** (`src/app/api/machines/route.ts`)
   - GET: Requires auth
   - POST: Requires admin

6. **Individual Product API** (`src/app/api/machines/[id]/route.ts`)
   - GET: Requires auth
   - PUT: Requires admin
   - DELETE: Requires admin

##### Employee-Accessible Routes
These routes are accessible to both admins and employees:

1. **Product IN/OUT** (`src/app/api/machine-io/*`)
   - All operations accessible to employees
   - Scanning, validation, check-in, check-out

2. **Alerts** (`src/app/api/alerts/*`)
   - View and acknowledge alerts

3. **Profile** (`src/app/api/profile/route.ts`)
   - View and edit own profile

### 3. Middleware Protection

**Location**: `src/middleware.ts`

#### Admin-Only Paths
The following paths are blocked for employees at the middleware level:

```typescript
const adminOnlyPaths = [
  "/users",
  "/reports", 
  "/categories", 
  "/suppliers", 
  "/store-rooms",
  "/plants",
  "/types",
  "/items",
  "/maintenance",
  "/qr/scanner",
  "/products/new",
];
```

#### Path Checking Logic
- Exact path matches
- Prefix matches (e.g., `/users/*`)
- Pattern matches for edit pages (e.g., `/products/[id]/edit`)

#### Redirect Behavior
- Employees attempting to access admin-only pages are redirected to home (`/`)
- API requests return 403 Forbidden status

## Security Features

### Multi-Layer Protection
1. **Frontend** - UI elements hidden based on role
2. **Middleware** - Route-level blocking before request reaches handler
3. **API** - Permission checks in each route handler
4. **Database** - Prisma queries respect user context

### JWT Token Validation
- All protected routes verify JWT token
- Token contains user ID, role, email, and name
- Expired or invalid tokens result in 401 Unauthorized

### Error Responses
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Valid auth but insufficient permissions

## Testing Checklist

### Admin User Testing
- [ ] Can create new products
- [ ] Can edit existing products
- [ ] Can delete products
- [ ] Can create users
- [ ] Can create suppliers, categories, store rooms
- [ ] Can access reports page
- [ ] Can perform product IN/OUT operations

### Employee User Testing
- [ ] Can view products list
- [ ] Cannot see "Add Product" button
- [ ] Cannot see Edit/Delete buttons on products
- [ ] Can view product details
- [ ] Can perform product IN/OUT operations (full access)
- [ ] Cannot access /users page (redirected)
- [ ] Cannot access /reports page (redirected)
- [ ] Cannot access /suppliers page (redirected)
- [ ] Cannot access /categories page (redirected)
- [ ] Cannot access /store-rooms page (redirected)
- [ ] Can view dashboard
- [ ] Can view alerts
- [ ] Can edit own profile

### API Testing
- [ ] Employee POST to /api/users returns 403
- [ ] Employee POST to /api/machines returns 403
- [ ] Employee PUT to /api/machines/[id] returns 403
- [ ] Employee DELETE to /api/machines/[id] returns 403
- [ ] Employee GET to /api/machines works
- [ ] Employee POST to /api/machine-io/out works
- [ ] Employee POST to /api/machine-io/in works

## Migration Notes

### Existing Users
- All existing users retain their current roles
- No database migration required
- Roles are already defined in Prisma schema

### Default Behavior
- New users created without role specification default to EMPLOYEE
- Admin users must be created by existing admins

## Future Enhancements

### Potential Additions
1. **Granular Permissions** - More fine-grained permission system
2. **Audit Logging** - Track all admin actions
3. **Role Management UI** - Allow admins to change user roles
4. **Custom Roles** - Support for additional role types
5. **Permission Groups** - Group permissions for easier management
6. **Time-Based Access** - Temporary permission grants
7. **IP Restrictions** - Limit admin access by IP address

## Troubleshooting

### Common Issues

**Issue**: Employee can still see admin buttons
- **Solution**: Clear browser cache and reload page
- **Cause**: Old JavaScript bundle cached

**Issue**: Admin gets 403 on valid operations
- **Solution**: Check JWT token expiration, re-login
- **Cause**: Token expired or corrupted

**Issue**: Middleware not blocking admin pages
- **Solution**: Verify path is in `adminOnlyPaths` array
- **Cause**: Path not configured in middleware

**Issue**: API returns 401 instead of 403
- **Solution**: Check if JWT token is being sent in cookies
- **Cause**: Authentication failing before permission check
