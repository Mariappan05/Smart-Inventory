# Schedule Management System - Implementation Guide

## Overview
You now have a complete, unified Schedule Management system with three main sections accessible from a single page. Admin users can manage monthly supplier order schedules through an integrated interface.

## 📍 How to Access

**Navigation Path**: Click "Schedule" in the sidebar (Admin Only)
- **URL**: `/schedules`
- The sidebar link has been updated to point to the main schedule hub

## 📋 Three Sections

### 1. **Tentative Schedule** (Create Orders)
📅 **Purpose**: Create monthly order schedules

**Order Form Fields**:
- **Schedule Date**: When this schedule is created (defaults to today)
- **Company Name**: Select supplier from dropdown
- **Item Description**: Select item to order
- **Quantity**: Number of units
- **Plant Name**: Select destination plant
- **Price Entry**: 
  - Choose between Unit Price or Total Price mode
  - Enter the price (₹)
- **Order Delivery Date**: Expected delivery date

**Price Display** (View-Only):
- Shows unit price, base total, 18% GST, and total with GST
- Price is calculated automatically as you fill the form
- Not included in actual billing

**Tentative Schedules List**:
- Shows all created tentative schedules in a table
- Displays: Schedule Date, Supplier, Type, Item, Plant, Quantity, Total, Delivery Date
- Delete option available for each schedule

---

### 2. **Final Schedule** (Manage Active Orders)
✅ **Purpose**: Manage and complete orders before delivery date

**Active Schedules Display**:
- Shows only schedules **before** their delivery date
- Automatically filtered by the system

**Edit Capability**:
- Click "Edit" button to modify:
  - Quantity
  - Order Delivery Date
  - Notes (additional instructions)
- Changes can be saved or cancelled

**Complete Order**:
- Click "Complete" button when order is received/processed
- Moves the schedule to completed status

**Print Bill**:
- Click "Print Bill" button to generate order delivery bill
- Bill includes all details from tentative schedule
- Price details are **hidden** in the bill (as required)
- Open print dialog to print or save as PDF

---

### 3. **Expired Schedules** (View Archives)
⚠️ **Purpose**: Track schedules past their delivery date

**Expired Schedules List**:
- Shows all schedules **after** their delivery date
- Displays in table format
- Includes all relevant details
- Read-only (for tracking/audit purposes)

---

## 🔐 Access Control
- **Admin Only**: Schedule management is restricted to admin users
- All CRUD operations require admin authentication

## 🛠️ Technical Stack

**Frontend**:
- React with hooks (useState, useEffect)
- Next.js 13+ (App Router)
- Tailwind CSS for styling
- Toast notifications for feedback

**Backend**:
- Next.js API Routes
- Prisma ORM for database
- PostgreSQL database
- Authentication via requireAdmin middleware

**Key Files**:
```
src/
  app/
    schedules/
      page.tsx                    # Main schedule hub page
      tentative/page.tsx          # Tentative schedule sub-page
      final/page.tsx              # Final schedule sub-page
      expired/page.tsx            # Expired schedule sub-page
    api/
      schedules/
        route.ts                  # GET, POST handlers
        [id]/route.ts             # PATCH, DELETE handlers
  
  views/
    schedules/
      ScheduleHubView.tsx         # NEW - Tabbed interface
      TentativeScheduleView.tsx   # Order creation form
      FinalScheduleView.tsx       # Active order management
      ExpiredScheduleView.tsx     # Archive/tracking
  
  components/
    layout/
      Sidebar.tsx                 # UPDATED - Navigation link
```

## 📊 Data Model (Schedule)
```
Schedule {
  id: string
  scheduleDate: DateTime
  supplierId: string
  typeId: string
  itemId: string
  plantId: string
  quantity: int
  unitPrice: float
  totalPrice: float (qty × unitPrice)
  gstAmount: float (totalPrice × 0.18)
  totalWithGst: float (totalPrice + gstAmount)
  orderDeliveryDate: DateTime
  status: "TENTATIVE" | "FINAL" | "COMPLETED" | "EXPIRED"
  completedAt: DateTime?
  notes: string?
}
```

## 💡 Business Logic

**Status Transitions**:
1. **TENTATIVE** → Created when schedule is first added
2. **FINAL** → Auto-filtered to show in Final Schedule section
3. **COMPLETED** → When marked as completed by admin
4. **EXPIRED** → Auto-marked when delivery date passes

**Date-Based Filtering**:
- **Final Schedule**: Shows TENTATIVE/FINAL schedules where deliveryDate >= today
- **Expired Schedule**: Shows TENTATIVE/FINAL schedules where deliveryDate < today

**Price Calculation**:
- GST Rate: 18% (fixed)
- Base Price: Quantity × Unit Price
- GST Amount: Base Price × 0.18
- Total with GST: Base Price + GST Amount

## 🚀 Next Steps (Optional Enhancements)

1. **Bulk Operations**: Select multiple schedules to complete/delete at once
2. **Export**: Export schedules to CSV/Excel
3. **Notifications**: Email alerts when delivery date approaches
4. **Report**: Schedule fulfillment analytics
5. **History**: Track all changes with audit log

## 📞 Support

For issues or questions:
- Check the sidebar navigation is working correctly
- Verify admin role is assigned to your user
- Check browser console for any errors
- Ensure all dates are in the correct format (YYYY-MM-DD)

---

**Version**: 1.0  
**Last Updated**: May 11, 2026  
**Status**: ✅ Production Ready
