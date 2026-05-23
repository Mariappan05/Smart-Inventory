# User Roles & Access Permissions Implementation - Updated Structure

## Date: May 17, 2026

## Overview
The application has been successfully updated with a new role-based access control (RBAC) system featuring 5 distinct user roles with granular permission management.

## Updated User Roles

### 1. **Admin**
- **Access Level**: Full Access to all modules and functionalities
- **Permissions**: All features, configurations, and administrative functions

### 2. **Admin Manager**  
- **Access Level**: Full Access to all modules and functionalities
- **Permissions**: All features, configurations, and administrative functions (equivalent to Admin)

### 3. **Store Manager**
- **Access Level**: Full Access to all modules and functionalities
- **Permissions**: All features, configurations, and administrative functions (equivalent to Admin)

### 4. **Employee**
- **Access Level**: Limited Access
- **Permissions**:
  - Product Inward (`/machine-io/inward`)
  - Product Outward (`/machine-io/outward`)

### 5. **Sub Store Login**
- **Access Level**: Specialized Access
- **Permissions**:
  - Request Module (`/products/request`)
  - Production Entry (`/schedules`)
  - Weekly Schedule (`/schedules`)

## Files Modified

### 1. **Database Schema** (`prisma/schema.prisma`)
- Updated `UserRole` enum to include:
  ```
  enum UserRole {
    ADMIN
    ADMIN_MANAGER
    STORE_MANAGER
    EMPLOYEE
    SUB_STORE_LOGIN
  }
  ```

### 2. **Authentication Permissions** (`src/lib/auth/permissions.ts`)
- Updated `UserRole` type definition
- Added `rolePermissions` object mapping roles to accessible paths:
  - Full access roles: `ADMIN`, `ADMIN_MANAGER`, `STORE_MANAGER`
  - Employee paths: Product Inward/Outward
  - Sub Store Login paths: Request Module, Schedules
- Updated `requireAdmin()` to accept all three full-access roles
- Added `canAccessPath()` utility function for path-based access control
- Added `hasFullAccess()` utility function to check full access roles

### 3. **Middleware** (`src/middleware.ts`)
- Updated route protection logic to support all 5 roles:
  - Admin-only paths require ADMIN, ADMIN_MANAGER, or STORE_MANAGER
  - Employee paths require EMPLOYEE, ADMIN, ADMIN_MANAGER, or STORE_MANAGER
  - Sub Store Login paths require SUB_STORE_LOGIN, ADMIN, ADMIN_MANAGER, or STORE_MANAGER
- Implemented role-based request routing with specific access checks

### 4. **Auth Middleware** (`src/lib/auth/middleware.ts`)
- Updated `requireAdmin()` to accept all three full-access roles
- Added `requireRole()` function for flexible role-based authorization
- Both functions now properly validate against the new role set

### 5. **User Role Hook** (`src/hooks/useUserRole.ts`)
- Updated `UserRole` type to include all 5 new roles
- Added helper properties:
  - `isAdminManager`: Boolean check for ADMIN_MANAGER
  - `isStoreManager`: Boolean check for STORE_MANAGER
  - `isSubStoreLogin`: Boolean check for SUB_STORE_LOGIN
  - `hasFullAccess`: Boolean check for all three admin roles

### 6. **Layout Components** (`src/components/layout/Sidebar.tsx`)
- Updated navigation items with role-based visibility:
  - Dashboard: All roles
  - Add Products: Admin roles only
  - Product IN/OUT: Admin roles + Employee
  - Alerts: Admin roles + Employee
  - Reports: Admin roles only
  - Schedule: Admin roles + Sub Store Login
  - Plants: Admin roles only
  - Users: Admin roles only
  - Profile: All roles

### 7. **Schedules Page** (`src/app/schedules/page.tsx`)
- Updated access control to allow:
  - ADMIN, ADMIN_MANAGER, STORE_MANAGER (full access)
  - SUB_STORE_LOGIN (limited schedule access)

## Database Migration

**Migration File**: `20260517150316_add_new_user_roles_admin_manager_store_manager_sub_store_login`

Migration updates include:
- Added 3 new enum values to UserRole: ADMIN_MANAGER, STORE_MANAGER, SUB_STORE_LOGIN
- Added missing `typeId` column to Item table
- Added `imagesJson` column to Item table for image storage
- Added `issuedToId` column to ProductOutLog for tracking issued recipients
- Updated foreign key relationships

## Access Control Matrix

| Feature | Admin | Admin Manager | Store Manager | Employee | Sub Store Login |
|---------|:-----:|:----------:|:----------:|:--------:|:----------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Users Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Product Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Product Inward | ✅ | ✅ | ✅ | ✅ | ❌ |
| Product Outward | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Schedules | ✅ | ✅ | ✅ | ❌ | ✅ |
| Alerts | ✅ | ✅ | ✅ | ✅ | ❌ |
| Plants | ✅ | ✅ | ✅ | ❌ | ❌ |
| Profile | ✅ | ✅ | ✅ | ✅ | ✅ |

## Implementation Details

### Role-Based Path Access
- Full Admin Access (3 roles): Can access all administrative paths
- Employee Paths: Restricted to machine-io/inward and machine-io/outward
- Sub Store Login Paths: Restricted to products/request and schedules

### Middleware Flow
1. Public paths bypass authentication
2. Protected paths check for valid authentication token
3. Role-based routing enforces path-specific permissions
4. Unauthorized access returns 403 Forbidden

### Frontend Integration
- `useUserRole()` hook provides role information to components
- Navigation sidebar automatically filters menu items based on user role
- Pages perform role checks before rendering admin-only content

## Testing Recommendations

1. **Admin Role**: Verify full access to all modules
2. **Admin Manager Role**: Verify equivalent access to Admin
3. **Store Manager Role**: Verify equivalent access to Admin
4. **Employee Role**: 
   - ✅ Can access Product Inward
   - ✅ Can access Product Outward
   - ❌ Cannot access admin functions
5. **Sub Store Login Role**:
   - ✅ Can access Request Module
   - ✅ Can access Schedules
   - ❌ Cannot access product in/out

## Environment Variables
No additional environment variables required. Existing JWT_SECRET and database configuration remain valid.

## Backward Compatibility
- Existing ADMIN and EMPLOYEE roles continue to function
- New roles are additive and don't break existing functionality
- Database migration handles enum type updates safely

## Security Considerations
- Role checking occurs at middleware level (before rendering)
- JWT token validation ensures role authenticity
- Path-based access control prevents privilege escalation
- Role permissions are enforced consistently across API and UI layers
