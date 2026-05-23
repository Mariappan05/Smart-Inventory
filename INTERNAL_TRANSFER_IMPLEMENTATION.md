# Internal Transfer Feature Implementation

## Changes Made

### 1. Database Schema Updates (prisma/schema.prisma)
- Added `Notification` model with fields: id, userId, title, message, type, isRead, productId, createdAt
- Added `notifications` relation to User model
- Added `issuedToId` field to ProductOutLog model to store the user ID for internal transfers

### 2. Product IN/OUT Page (src/views/machine-io/ScanViews.tsx)
- Added `isInternalTransfer` and `transferToUserId` to form state
- Added checkbox for "Internal Transfer" option
- Added conditional dropdown to select transfer recipient (filters out the issuing user)
- Updated MovementLog type to include `reason` field
- Display reason in movement logs with italic styling
- Pass new fields to API when marking product OUT

### 3. Scan Service (src/services/scanService.ts)
- Updated MovementActionInput type to include: issuedToId, isInternalTransfer, transferToUserId
- Added `createTransferNotification` private method to create notifications
- Call notification creation when internal transfer is detected
- Store issuedToId in ProductOutLog for tracking

### 4. Scan Controller (src/controllers/scanController.ts)
- Updated markOut method to pass new fields: issuedToId, isInternalTransfer, transferToUserId

### 5. Movement Repository (src/repositories/movementRepository.ts)
- Updated paginate method to fetch reason from ProductOutLog
- Join latest ProductOutLog to include reason in movement logs

### 6. Notification API (src/app/api/notifications/route.ts)
- GET endpoint: Fetch notifications for current user with unread count
- PATCH endpoint: Mark individual notification or all notifications as read
- Supports query parameter `unreadOnly=true` to filter unread notifications

## How It Works

1. **Mark Product OUT with Internal Transfer:**
   - User selects employee from dropdown
   - User checks "Internal Transfer" checkbox
   - User selects transfer recipient from second dropdown (excludes issuing user)
   - User enters reason and expected return date
   - System creates ProductOutLog with issuedToId
   - System creates notification for transfer recipient

2. **Notification Creation:**
   - When isInternalTransfer is true and transferToUserId is provided
   - Notification includes: product name, serial, and sender name
   - Type is set to "TRANSFER"
   - Links to productId for future navigation

3. **Display Reason:**
   - Movement logs now show reason field below the movement type
   - Reason is fetched from the latest ProductOutLog for each movement
   - Displayed in italic text with lighter color

## Next Steps (User Action Required)

1. **Run Database Migration:**
   ```bash
   npx prisma db push
   ```
   This will create the Notification table and add issuedToId column.

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```
   Close any running dev servers first to unlock the Prisma client files.

3. **Add Notification UI Component:**
   - Create notification bell icon in header/navbar
   - Display unread count badge
   - Show notification dropdown/panel
   - Mark notifications as read on click
   - Link to product details page

## API Endpoints

### GET /api/notifications
Fetch notifications for current user
- Query params: `unreadOnly=true` (optional)
- Returns: `{ notifications: [], unreadCount: number }`

### PATCH /api/notifications
Mark notifications as read
- Body: `{ notificationId: string }` OR `{ markAllAsRead: true }`
- Returns: Success message

## Database Schema

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
  title     String   @db.VarChar(200)
  message   String   @db.Text
  type      String   @db.VarChar(50)
  isRead    Boolean  @default(false)
  productId String?
  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@index([createdAt])
}
```
