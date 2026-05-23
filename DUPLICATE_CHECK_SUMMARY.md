# Duplicate Check Implementation Summary

All API endpoints now include duplicate validation before creating records. When a duplicate is detected, the API returns a 409 Conflict status with a user-friendly error message.

## Updated Endpoints

### 1. **POST /api/types**
- **Unique Constraint**: `supplierId + name`
- **Error Message**: `Type "XYZ" already exists for this supplier. Please use a different name.`
- **Status Code**: 409

### 2. **POST /api/items**
- **Unique Constraint**: `supplierId + name`
- **Error Message**: `Item "XYZ" already exists for this supplier. Please use a different name.`
- **Status Code**: 409

### 3. **POST /api/suppliers**
- **Unique Constraints**: 
  - `name` (unique globally)
  - `code` (unique globally)
- **Error Messages**: 
  - `Supplier "XYZ" already exists. Please use a different name.`
  - `Supplier code "ABC" already exists. Please use a different code.`
- **Status Code**: 409

### 4. **POST /api/plants**
- **Unique Constraint**: `name` (unique globally)
- **Error Message**: `Plant "XYZ" already exists. Please use a different name.`
- **Status Code**: 409

### 5. **POST /api/categories**
- **Unique Constraint**: `supplierId + name`
- **Error Message**: `Category "XYZ" already exists for this supplier. Please use a different name.`
- **Status Code**: 409

### 6. **POST /api/users**
- **Unique Constraints**: 
  - `email` (unique globally)
  - `employeeNo` (unique globally)
- **Error Messages**: 
  - `Email "user@example.com" is already registered. Please use a different email.`
  - `Employee number "EMP001" already exists. Please use a different number.`
- **Status Code**: 409

### 7. **POST /api/machines** (Products)
- **Unique Constraint**: `serial` (unique globally)
- **Error Message**: `Product with serial number "S001" already exists. Please use a different serial number.`
- **Status Code**: 409

## Response Format

All endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Duplicate item",
  "message": "Item \"XYZ\" already exists for this supplier. Please use a different name."
}
```

## Frontend Integration

To display these notifications to users, handle the error response in your frontend:

```typescript
const response = await fetch('/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, supplierId })
});

const data = await response.json();

if (!response.ok) {
  // Show error notification
  toast.error(data.message || data.error || 'Failed to create item');
  return;
}

// Show success notification
toast.success('Item created successfully');
```

## Benefits

1. ✅ **Prevents database constraint errors** - Validates before attempting to create
2. ✅ **User-friendly messages** - Clear, actionable error messages
3. ✅ **Consistent error handling** - All endpoints follow the same pattern
4. ✅ **Proper HTTP status codes** - Uses 409 Conflict for duplicates
5. ✅ **Better UX** - Users know exactly what went wrong and how to fix it

## Database Schema Constraints

The following unique constraints are enforced at the database level:

- **Type**: `@@unique([supplierId, name])`
- **Item**: `@@unique([supplierId, name])`
- **Supplier**: `@unique` on `name` and `code`
- **Plant**: `@unique` on `name`
- **User**: `@unique` on `email` and `employeeNo`
- **Product**: `@unique` on `serial`

These API-level checks prevent the database errors from reaching the user and provide better error messages.
