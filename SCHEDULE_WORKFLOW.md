## Smart Machine Inventory - Schedule Management System

### ✅ SCHEDULE CREATION WORKFLOW

#### 1. **Tentative Schedule Creation**
- **Where**: Admin navigates to `/schedules` → Tentative Schedule section
- **What**: Admin selects:
  - Product Name (Item) - Only shows items where `stockQuantity < minimumQuantity`
  - Quantity to reorder
- **Auto-populated**:
  - Supplier (from selected Item)
  - Type (from selected Item)
  - Plant (defaults to first plant)
  - Schedule Date (today)
  - Order Delivery Date (today + 14 days)
  - Stock information (display only)
- **Validation**: 
  - ✅ Schedule created ONLY if current stock < minimum quantity
  - ❌ If stock >= minimum: Error message "Cannot create schedule. Current stock (X) is not below minimum (Y). Schedule will be auto-created when stock drops below minimum."
- **Real-time Notification**:
  - 📢 Plant admins receive notification: "New order created for [Item Name] (Qty: X units) from [Source Plant]"

#### 2. **Final Schedule Confirmation**
- **Where**: `/schedules` → Final Schedule section
- **What**: Admin reviews tentative schedules and confirms they are ready for ordering
- **Editable**: Only Quantity field
- **Status**: Changes from `TENTATIVE` to `FINAL`

#### 3. **Bill Generation**
- **Action**: Admin clicks "Generate Bill" button
- **Process**:
  - Generates unique Bill ID (first 8 chars of Schedule ID, uppercase)
  - Creates QR code with order information: `{ billId, scheduleId, item, quantity, supplier, totalAmount, generatedAt }`
  - Stores bill URL and QR code in Schedule record
  - Status changes to `BILL_GENERATED`
- **QR Code Available**: Can be printed or downloaded separately
- **Real-time Notification**:
  - 📢 Plant admin: "Bill generated for [Item Name]. Ready for purchase order submission."

#### 4. **Bill Receipt Confirmation**
- **Action**: Admin clicks "Confirm Bill Receipt" and enters supplier bill number
- **Process**:
  - Supplier delivers ordered items with their bill
  - Admin enters supplier's bill number
  - Schedule status changes to `DELIVERED`
  - **Automatic Product IN movement created**:
    - Type: `IN`
    - Quantity: order quantity
    - Source: Schedule ID
    - Item stock quantity is automatically incremented
- **Real-time Notification**:
  - 📢 Plant admin: "[Item Name] (Qty: X units) received from [Supplier]. Moved to Product IN/OUT."

---

### 📊 REAL-TIME NOTIFICATIONS

#### Notification Recipients
- **Plant Admins**: Notified of events related to their plant
- **Super Admins**: Notified of all system events
- **Delivery Managers**: Notified of supply chain updates

#### Notification Types

| Event | Trigger | Message | Recipient |
|-------|---------|---------|-----------|
| Schedule Created | New tentative schedule | New order created for [Item] (Qty: X units) from [Plant] | Plant Admin |
| Bill Generated | Generate Bill clicked | Bill generated for [Item]. Ready for purchase order submission. | Plant Admin |
| Stock Replenished | Bill confirmed | [Item] (Qty: X units) received from [Supplier]. Moved to Product IN/OUT. | Plant Admin |
| Stock Low Warning | Stock < minimum | Stock alert: [Item] stock is running low. Consider creating reorder. | Plant Admin |
| Order Overdue | Delivery date passed | Order for [Item] from [Supplier] has not been received yet. | Plant Admin |

#### Notification Channels
- 🔔 In-app notifications (persistent)
- 📧 Email notifications (daily digest)
- 📱 Mobile push (if app installed)

---

### 🔄 PRODUCT IN/OUT INTEGRATION

#### Automatic Movement to Product IN/OUT
When a bill is confirmed (step 4 above):
1. A **Product IN** movement is automatically created with:
   - **Item**: The ordered item
   - **Quantity**: Amount received from supplier
   - **Source**: Schedule ID (bill reference)
   - **Supplier**: Supplier name
   - **Plant**: Destination plant
   - **Notes**: Full bill details including supplier bill number
   - **Timestamp**: Current date/time

2. **Item Stock is Updated**:
   - `Item.stockQuantity` increased by order quantity
   - `Item.updatedAt` set to current time

3. **Visible in Product IN/OUT Page**:
   - Shows all received items with their bills
   - Can be marked as verified/confirmed
   - Tracks full history of deliveries

---

### ⚙️ AUTOMATED OPERATIONS (Not yet implemented)

#### Monthly Schedule Auto-Creation (25th)
- **Cron Job**: Runs at 00:00 on 25th of each month
- **Process**:
  - Query all Items where `stockQuantity < minimumQuantity`
  - For each item, create Tentative Schedule if not already exists
  - Auto-populate: Supplier, Type, Plant, Dates
  - Set quantity = Item.reorderQuantity
- **Notification**: "Auto-created monthly reorder schedule for [Item]"

#### Delivery Reminder (5th of Month)
- **Cron Job**: Runs at 09:00 on 5th of each month
- **Process**:
  - Query Tentative Schedules with orderDeliveryDate in current month
  - Check if not yet delivered
  - Send reminder notifications
- **Notification**: "Reminder: Expected delivery of [Item] today from [Supplier]"

---

### 🎯 STATUS FLOW

```
TENTATIVE → FINAL → BILL_GENERATED → DELIVERED → CLOSED
   ↓         ↓          ↓                ↓
Create   Review    Generate         Confirm
  Order  & Confirm   Bill & QR      & Move to IN
```

**Status Meanings:**
- `TENTATIVE`: Initial schedule created, not yet confirmed
- `FINAL`: Confirmed ready for ordering
- `BILL_GENERATED`: Bill created with QR code, waiting for receipt
- `DELIVERED`: Supplier bill received, items moved to stock
- `CLOSED`: Order fully processed and archived

---

### 🔐 ACCESS CONTROL

- **Tentative Schedule Page**: Admin-only ✅
- **Final Schedule Page**: Admin-only ✅
- **Bill Generation**: Admin-only ✅
- **Bill Receipt Confirmation**: Admin-only ✅
- **Product IN/OUT View**: All users (read-only)
- **Product IN/OUT Actions**: Plant Admin or Super Admin

---

### 📋 VALIDATION RULES

1. **Stock Validation** ✅
   - Schedule created ONLY if: `current_stock < minimum_quantity`
   - Error if: `current_stock >= minimum_quantity`

2. **Quantity Validation**
   - Minimum quantity: 1 unit
   - Maximum quantity: Item.reorderQuantity (can be edited)

3. **Date Validation**
   - Schedule Date: Cannot be in the past
   - Order Delivery Date: Must be at least 14 days from today

4. **Bill Number Validation**
   - Supplier Bill Number: Optional, max 100 characters
   - Cannot be duplicate for same supplier

---

### 🛠️ API ENDPOINTS

#### Schedule Creation
```
POST /api/schedules
Body: { scheduleDate, supplierId, typeId, itemId, plantId, quantity, unitPrice, orderDeliveryDate }
Response: { success, data: { id, status, ... } }
Validation: Stock must be < minimum
```

#### Bill Generation
```
POST /api/schedules/{id}/generate-bill
Response: { success, data: { billId, qrCodeUrl, billUrl, ... } }
Updates: status → BILL_GENERATED, billUrl, qrCode
```

#### Bill Receipt Confirmation
```
POST /api/schedules/{id}/confirm-bill
Body: { billReceivedDate, supplierBillNumber }
Response: { success, data: { schedule, movement } }
Updates: status → DELIVERED, creates Product IN movement
```

---

### 🎨 UI FLOW

#### Admin Workflow
1. **Go to Schedules Page** → Admin-only access check
2. **Tentative Schedule Tab**
   - See list of items needing reorder
   - Select Product + Quantity
   - See all auto-populated details
   - Click "Create Schedule"
   - See notification: "Schedule created successfully"
3. **Final Schedule Tab**
   - Review tentative schedules
   - Edit quantity if needed
   - Confirm ready for ordering
4. **Bill Generation**
   - Click "Generate Bill"
   - Confirm action
   - See QR code displayed
   - Can print bill or download QR separately
5. **Bill Receipt**
   - Click "Confirm Bill Receipt"
   - Enter supplier bill number
   - Confirm delivery
   - See notification: "Item moved to Product IN/OUT"
6. **Verify in Product IN/OUT**
   - Navigate to Products → IN/OUT
   - See the received item in Product IN section

---

### 📊 SYSTEM BENEFITS

✅ **Stock Management**: Automatic reordering when stock is low
✅ **Real-time Visibility**: Track all orders from creation to delivery
✅ **Automated Workflow**: Bill confirmation auto-updates stock
✅ **Audit Trail**: Full history of all schedules and movements
✅ **Error Prevention**: Validation prevents double-ordering
✅ **Notifications**: All stakeholders kept informed
✅ **QR Tracking**: Each order trackable via QR code
✅ **Mobile Friendly**: Can print bills and scan QR codes on-site
