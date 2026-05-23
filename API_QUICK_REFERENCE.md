# 🎯 SCHEDULE API QUICK REFERENCE

## API ENDPOINTS

### 1️⃣ CREATE TENTATIVE SCHEDULE
```
POST /api/schedules
Auth: Admin required ✅
Body: {
  scheduleDate: ISO datetime (today),
  supplierId: string,
  typeId: string,
  itemId: string,
  plantId: string,
  quantity: number (≥1),
  unitPrice: number (0 by default),
  orderDeliveryDate: ISO datetime (today + 14 days)
}

Response: { success: true, data: { id, status: "TENTATIVE", ... } }

Validation:
  ✅ Item must exist
  ✅ Item.stockQuantity < Item.minimumQuantity (CRITICAL)
  ✅ All fields required
  ✅ Only admins can create
```

**Error Example**:
```json
{
  "success": false,
  "message": "Cannot create schedule. Current stock (75) is not below minimum (50). Schedule will be auto-created when stock drops below minimum."
}
```

---

### 2️⃣ FETCH SCHEDULES
```
GET /api/schedules?status=TENTATIVE|FINAL|BILL_GENERATED|DELIVERED
Auth: Admin required ✅

Response: { success: true, data: [...] }
```

---

### 3️⃣ UPDATE SCHEDULE (PATCH)
```
PATCH /api/schedules/{id}
Auth: Admin required ✅
Body: {
  quantity?: number,           // For Final Schedule editing
  status?: string,             // FINAL, COMPLETED, etc.
  targetPlantId?: string,
  itemName?: string
}

Response: { success: true, data: { ... } }
```

---

### 4️⃣ GENERATE BILL & QR CODE
```
POST /api/schedules/{id}/generate-bill
Auth: Admin required ✅
Body: {} (empty)

Response: {
  "success": true,
  "message": "Bill generated successfully",
  "data": {
    "billId": "ABC12345",
    "schedule": { ... },
    "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?...",
    "billUrl": "/api/schedules/{id}/bill-pdf"
  }
}

Updates:
  - Schedule.status: FINAL → BILL_GENERATED
  - Schedule.billUrl: Stored
  - Schedule.qrCode: Stored
```

---

### 5️⃣ GET BILL DETAILS (for printing)
```
GET /api/schedules/{id}/bill-pdf
Auth: Public (protected by schedule visibility)

Response: {
  "success": true,
  "data": {
    "billId": "ABC12345",
    "scheduleId": "...",
    "item": { "id": "...", "name": "..." },
    "supplier": { ... },
    "type": { ... },
    "plant": { ... },
    "quantity": 50,
    "unitPrice": 100,
    "totalPrice": 5000,
    "gstAmount": 900,
    "totalWithGst": 5900,
    "qrCodeUrl": "...",
    "generatedAt": "2026-05-13T10:30:00Z"
  }
}
```

---

### 6️⃣ CONFIRM BILL RECEIPT & MOVE TO PRODUCT IN/OUT
```
POST /api/schedules/{id}/confirm-bill
Auth: Admin required ✅
Body: {
  billReceivedDate: ISO datetime,
  supplierBillNumber: string (max 100 chars)
}

Response: {
  "success": true,
  "message": "Bill confirmed and item moved to Product IN/OUT",
  "data": {
    "schedule": {
      "id": "...",
      "status": "DELIVERED",
      "deliveryDate": "2026-05-13T14:00:00Z",
      "supplierBillNumber": "INV-2026-5123",
      ...
    },
    "movement": {
      "id": "...",
      "type": "IN",
      "itemId": "...",
      "quantity": 50,
      "source": "Schedule #ABC12345",
      "supplier": "Supplier Name",
      "plantId": "...",
      "createdBy": "system",
      ...
    }
  }
}

Auto-Updates:
  - Schedule.status: BILL_GENERATED → DELIVERED
  - Schedule.deliveryDate: Set
  - Schedule.supplierBillNumber: Set
  - Item.stockQuantity: Incremented by order qty
  - Creates Product IN movement
```

---

### 7️⃣ DELETE SCHEDULE
```
DELETE /api/schedules/{id}
Auth: Admin required ✅

Response: { success: true, message: "Schedule deleted" }
```

---

## 🔄 STATUS FLOW

```
┌─────────────┐
│  TENTATIVE  │  ← Created (Initial)
└──────┬──────┘
       │ Admin confirms ready for ordering
       ↓
┌─────────────┐
│   FINAL     │  ← Confirmed (Not yet ordered)
└──────┬──────┘
       │ Admin generates bill
       ↓
┌──────────────────┐
│ BILL_GENERATED   │  ← Bill ready (New Status)
└──────┬───────────┘
       │ Supplier delivers & bill received
       ↓
┌──────────────┐
│  DELIVERED   │  ← Items received (moved to IN)
└──────┬───────┘
       │ Final processing complete
       ↓
┌─────────────┐
│   CLOSED    │  ← Archived
└─────────────┘
```

---

## ⚙️ FILTERING & QUERIES

### Get Tentative Schedules
```
GET /api/schedules?status=TENTATIVE
Returns: Schedules created but not yet confirmed
```

### Get Final Schedules (Ready for Ordering)
```
GET /api/schedules?status=FINAL
Returns: Confirmed schedules, awaiting bill generation
```

### Get Bills Awaiting Receipt
```
GET /api/schedules?status=BILL_GENERATED
Returns: Bills generated, waiting for supplier delivery
```

### Get Delivered Schedules
```
GET /api/schedules?status=DELIVERED
Returns: Orders completed, items received and in stock
```

---

## 📱 UI BUTTON ACTIONS

### In Tentative Schedule View
| Button | Action | Validation |
|--------|--------|-----------|
| Create Schedule | POST /api/schedules | Stock < minimum |
| Delete | DELETE /api/schedules/{id} | Soft delete |

### In Final Schedule View
| Button | Action | Condition | Result |
|--------|--------|-----------|--------|
| Edit Quantity | PATCH /api/schedules/{id} | status=FINAL | Updates qty |
| Generate Bill | POST /api/schedules/{id}/generate-bill | status=FINAL | Creates bill & QR → BILL_GENERATED |
| Confirm Bill Receipt | POST /api/schedules/{id}/confirm-bill | status=BILL_GENERATED | Moves to IN → DELIVERED |
| Print Bill | Window.open() | Any | Opens print dialog |
| Download QR | Link click | Any | Downloads QR image |

---

## 🎨 FORM FIELDS

### Tentative Schedule FORM
```
User Input:
  - Product Name (itemId) [Required, dropdown filtered by stock]
  - Quantity (number) [Required, ≥1]

Auto-Populated (Display Only):
  - Supplier: From selected Item
  - Type: From selected Item
  - Current Stock: From Item.stockQuantity
  - Minimum Qty: From Item.minimumQuantity
  - Reorder Qty: From Item.reorderQuantity
  - Schedule Date: Today
  - Delivery Date: Today + 14 days
  - Plant: First available plant
  - Unit Price: 0 (default)
  - Total with GST: Calculated
```

### Final Schedule EDITING
```
Editable:
  - Quantity (number only)

Read-Only:
  - Supplier
  - Type
  - Item
  - Plant
  - Unit Price
  - Schedule Date
  - Delivery Date
  - Stock Info
```

---

## 🔍 DEBUGGING TIPS

### Check If Item Can Be Scheduled
```javascript
// Item must have:
// 1. stockQuantity < minimumQuantity
// 2. Valid supplierId
// 3. Valid typeId

const canSchedule = item.stockQuantity < item.minimumQuantity;
```

### Verify Schedule Status Progression
```
TENTATIVE → FINAL → BILL_GENERATED → DELIVERED
     ✅        ✅          ✅           ✅
   (auto)  (click)      (click)     (confirm)
```

### QR Code Data Format
```json
{
  "billId": "ABC12345",
  "scheduleId": "full-uuid-string",
  "item": "Product Name",
  "quantity": 50,
  "supplier": "Supplier Name",
  "totalAmount": 5900,
  "generatedAt": "2026-05-13T10:30:00Z"
}
```

---

## 🚨 COMMON ERRORS & SOLUTIONS

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot create schedule. Current stock (75) is not below minimum (50)." | Stock is sufficient | Wait for stock to drop or manually reduce it |
| "Item not found" | Invalid itemId | Verify item exists and ID is correct |
| "Only FINAL schedules can generate bills" | Schedule status wrong | First move schedule to FINAL status |
| "Bill must be generated first" | Trying to confirm before generate | Click "Generate Bill" first |
| "Access Denied" | Not admin user | Log in with admin account |
| "Schedule not found" | Invalid ID | Verify schedule ID is correct |

---

## 📊 DATABASE FIELDS

### Schedule Model
```prisma
id                 String         @id @default(cuid())
scheduleDate       DateTime       // When order was placed
orderDeliveryDate  DateTime       // Expected delivery date
deliveryDate       DateTime?      // Actual delivery date (NEW)
supplierBillNumber String?        // Supplier's invoice #  (NEW)
billUrl            String?        // Generated bill URL
qrCode             String?        // QR code data
status             ScheduleStatus // TENTATIVE|FINAL|BILL_GENERATED|DELIVERED|...
quantity           Int            // Order quantity
unitPrice          Float          // Price per unit
totalPrice         Float          // quantity × unitPrice
gstAmount          Float          // GST (18%)
totalWithGst       Float          // Total with GST
```

### ScheduleStatus Enum
```prisma
TENTATIVE       // Initial, not confirmed
FINAL           // Confirmed, ready to order
BILL_GENERATED  // Bill created ← NEW
COMPLETED       // Order placed with supplier
DELIVERED       // Goods received
CLOSED          // Order archived
EXPIRED         // Did not proceed
```

---

**Last Updated**: May 13, 2026  
**Version**: 1.0 - Production Ready
