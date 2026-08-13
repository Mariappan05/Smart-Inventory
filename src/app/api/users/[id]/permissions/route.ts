import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStrictAdmin } from "@/lib/auth/permissions";

const ALL_MODULES = [
  "Dashboard",
  "Monthly Plan",
  "Inward",
  "Outward",
  "Products",
  "Tools",
  "Suppliers",
  "Machines",
  "Supplier PO",
  "Request",
  "Incoming Requests",
  "Production Entry",
  "Product Process",
  "Store Rooms",
  "Maintenance",
  "Reports",
  "Alerts"
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireStrictAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    const { id: userId } = await params;

    // Get current permissions
    const permissions = await prisma.userPagePermission.findMany({
      where: { userId },
    });

    // Format and return, populating defaults for any missing modules
    const formatted = ALL_MODULES.map((moduleName) => {
      const match = permissions.find((p) => p.pageName === moduleName);
      return {
        pageName: moduleName,
        canView: match ? match.canView : true,
        canCreate: match ? match.canCreate : false,
        canEdit: match ? match.canEdit : false,
        canDelete: match ? match.canDelete : false,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireStrictAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    const { id: userId } = await params;

    const body = await request.json();
    const { permissions } = body; // Array of { pageName, canView, canCreate, canEdit, canDelete }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: "Permissions list is required" },
        { status: 400 }
      );
    }

    // Update or insert permissions
    await Promise.all(
      permissions.map((p) =>
        prisma.userPagePermission.upsert({
          where: {
            userId_pageName: {
              userId,
              pageName: p.pageName,
            },
          },
          update: {
            canView: p.canView,
            canCreate: p.canCreate,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
          },
          create: {
            userId,
            pageName: p.pageName,
            canView: p.canView,
            canCreate: p.canCreate,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
          },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Permissions updated successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save permissions" },
      { status: 500 }
    );
  }
}
