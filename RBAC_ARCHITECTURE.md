# RBAC System Architecture

## Access Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                               │
│                    (Admin or Employee)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  JWT Token     │
                    │  Generated     │
                    │  (role: ADMIN  │
                    │   or EMPLOYEE) │
                    └────────┬───────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │                                        │
        ▼                                        ▼
┌───────────────┐                      ┌─────────────────┐
│   FRONTEND    │                      │   MIDDLEWARE    │
│   (Layer 1)   │                      │   (Layer 2)     │
└───────┬───────┘                      └────────┬────────┘
        │                                       │
        │ useUserRole() hook                    │ Path checking
        │ checks JWT token                      │ Role validation
        │                                       │
        ▼                                       ▼
┌───────────────────────┐            ┌──────────────────────┐
│ IF ADMIN:             │            │ IF EMPLOYEE tries    │
│ ✅ Show all buttons   │            │ admin path:          │
│ ✅ Show all menus     │            │ ❌ Redirect to /     │
│                       │            │ ❌ Return 403        │
└───────────────────────┘            └──────────────────────┘
        │                                       │
        │                                       │
        └───────────────┬───────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │   API ROUTE   │
                │   (Layer 3)   │
                └───────┬───────┘
                        │
                        │ requireAuth() or
                        │ requireAdmin()
                        │
                        ▼
        ┌───────────────────────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌─────────────────┐
│ IF AUTHORIZED:   │              │ IF UNAUTHORIZED:│
│ ✅ Process       │              │ ❌ Return 401   │
│    request       │              │    or 403       │
│ ✅ Return data   │              │                 │
└──────────────────┘              └─────────────────┘
```

## Role-Based Menu Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      SIDEBAR MENU                            │
└─────────────────────────────────────────────────────────────┘

ADMIN VIEW                          EMPLOYEE VIEW
═══════════════════════════════     ═══════════════════════════
✅ Dashboard                         ✅ Dashboard
✅ Products                          ✅ Products (view only)
✅ Product IN/OUT                    ✅ Product IN/OUT (full)
✅ Alerts                            ✅ Alerts
✅ Reports                           ❌ (hidden)
✅ Suppliers                         ❌ (hidden)
✅ Types                             ❌ (hidden)
✅ Items                             ❌ (hidden)
✅ Plants                            ❌ (hidden)
✅ Users                             ❌ (hidden)
✅ Profile                           ✅ Profile
```

## Product Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    PRODUCTS PAGE                              │
└──────────────────────────────────────────────────────────────┘

ADMIN VIEW:
┌─────────────────────────────────────────────────────────────┐
│  Products                                    [Add Product]   │
├─────────────────────────────────────────────────────────────┤
│  Serial  │  Item  │  Type  │  Status  │  Actions           │
├──────────┼────────┼────────┼──────────┼────────────────────┤
│  P001    │  Motor │  Type1 │  Active  │  👁️ ✏️ 🗑️         │
│  P002    │  Pump  │  Type2 │  Active  │  👁️ ✏️ 🗑️         │
└─────────────────────────────────────────────────────────────┘
         View  Edit  Delete (all visible)


EMPLOYEE VIEW:
┌─────────────────────────────────────────────────────────────┐
│  Products                                    (no button)     │
├─────────────────────────────────────────────────────────────┤
│  Serial  │  Item  │  Type  │  Status  │  Actions           │
├──────────┼────────┼────────┼──────────┼────────────────────┤
│  P001    │  Motor │  Type1 │  Active  │  👁️                │
│  P002    │  Pump  │  Type2 │  Active  │  👁️                │
└─────────────────────────────────────────────────────────────┘
         View only (edit/delete hidden)
```

## API Permission Matrix

```
┌────────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                              │
└────────────────────────────────────────────────────────────────┘

METHOD  │  ENDPOINT                │  ADMIN  │  EMPLOYEE
════════╪══════════════════════════╪═════════╪═══════════
GET     │  /api/machines           │   ✅    │    ✅
POST    │  /api/machines           │   ✅    │    ❌
GET     │  /api/machines/[id]      │   ✅    │    ✅
PUT     │  /api/machines/[id]      │   ✅    │    ❌
DELETE  │  /api/machines/[id]      │   ✅    │    ❌
────────┼──────────────────────────┼─────────┼───────────
GET     │  /api/users              │   ✅    │    ✅
POST    │  /api/users              │   ✅    │    ❌
────────┼──────────────────────────┼─────────┼───────────
GET     │  /api/suppliers          │   ✅    │    ✅
POST    │  /api/suppliers          │   ✅    │    ❌
────────┼──────────────────────────┼─────────┼───────────
GET     │  /api/categories         │   ✅    │    ✅
POST    │  /api/categories         │   ✅    │    ❌
────────┼──────────────────────────┼─────────┼───────────
POST    │  /api/machine-io/in      │   ✅    │    ✅
POST    │  /api/machine-io/out     │   ✅    │    ✅
POST    │  /api/machine-io/scan    │   ✅    │    ✅
────────┼──────────────────────────┼─────────┼───────────
GET     │  /api/alerts             │   ✅    │    ✅
GET     │  /api/reports            │   ✅    │    ❌
```

## Security Layers Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                              │
└─────────────────────────────────────────────────────────────┘

User Action (e.g., "Delete Product")
        │
        ▼
┌───────────────────────────────────────┐
│  LAYER 1: Frontend UI                 │
│  ─────────────────────                │
│  • Button hidden for employees        │
│  • useUserRole() hook check           │
│  • Prevents UI confusion              │
└───────────────┬───────────────────────┘
                │ (if button visible)
                ▼
┌───────────────────────────────────────┐
│  LAYER 2: Middleware                  │
│  ────────────────────                 │
│  • Path-based blocking                │
│  • JWT token validation               │
│  • Role verification                  │
│  • Redirect or 403 response           │
└───────────────┬───────────────────────┘
                │ (if authorized)
                ▼
┌───────────────────────────────────────┐
│  LAYER 3: API Route Handler           │
│  ────────────────────────             │
│  • requireAdmin() check               │
│  • Token re-validation                │
│  • Role-specific logic                │
│  • 401/403 on failure                 │
└───────────────┬───────────────────────┘
                │ (if all checks pass)
                ▼
┌───────────────────────────────────────┐
│  DATABASE OPERATION                   │
│  ──────────────────                   │
│  • Execute query                      │
│  • Return result                      │
└───────────────────────────────────────┘
```

## Permission Check Functions

```typescript
// Frontend Hook
useUserRole()
├── Returns: { role, isAdmin, isEmployee, loading }
└── Used in: All view components

// Backend Utilities
requireAuth(request)
├── Validates: JWT token exists and is valid
├── Returns: UserSession or 401 Response
└── Used in: All protected routes

requireAdmin(request)
├── Validates: JWT token + ADMIN role
├── Returns: UserSession or 401/403 Response
└── Used in: Admin-only routes (POST/PUT/DELETE)
```

## Data Flow Example: Creating a Product

```
ADMIN USER:
┌─────────────────────────────────────────────────────────────┐
│ 1. Clicks "Add Product" button (visible)                    │
│    ↓                                                         │
│ 2. Navigates to /products/new (middleware allows)           │
│    ↓                                                         │
│ 3. Fills form and submits                                   │
│    ↓                                                         │
│ 4. POST /api/machines                                       │
│    ↓                                                         │
│ 5. requireAdmin() passes ✅                                  │
│    ↓                                                         │
│ 6. Product created in database                              │
│    ↓                                                         │
│ 7. Success response returned                                │
└─────────────────────────────────────────────────────────────┘

EMPLOYEE USER:
┌─────────────────────────────────────────────────────────────┐
│ 1. "Add Product" button NOT visible ❌                       │
│    ↓ (if they try to navigate directly)                     │
│ 2. Types /products/new in browser                           │
│    ↓                                                         │
│ 3. Middleware blocks and redirects to / ❌                   │
│    ↓ (if they bypass middleware somehow)                    │
│ 4. POST /api/machines                                       │
│    ↓                                                         │
│ 5. requireAdmin() fails with 403 ❌                          │
│    ↓                                                         │
│ 6. Error: "Forbidden - Admin access required"               │
└─────────────────────────────────────────────────────────────┘
```

## Summary

✅ **3 Security Layers** protect every admin action
✅ **Frontend** hides UI elements from employees
✅ **Middleware** blocks unauthorized page access
✅ **API** validates permissions on every request
✅ **Employees** have full access to Product IN/OUT only
✅ **Admins** have unrestricted access to everything
