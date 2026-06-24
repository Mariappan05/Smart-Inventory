import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

// Prevent Next.js static generation — this route requires auth + DB access
export const dynamic = 'force-dynamic';

/**
 * GET /api/production-component-codes
 *
 * Returns all component codes (item codes from Products) for the dropdown.
 * Moved to a top-level route to avoid Vercel routing collision with
 * /api/production/[id] swallowing /api/production/component-codes.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const whereClause: Record<string, unknown> = {
      description: {
        startsWith: 'PRODUCT_',
      },
    };

    // Apply store-based access control
    if (
      user.role === 'STORE_MANAGER' ||
      user.role === 'SUB_STORE_LOGIN' ||
      user.role === 'EMPLOYEE'
    ) {
      if (user.storeId) {
        whereClause.storeId = user.storeId;
      }
    }

    const items = await prisma.item.findMany({
      where: whereClause,
      select: {
        itemCode: true,
        name: true,
      },
      orderBy: {
        itemCode: 'asc',
      },
    });

    const componentCodes = items
      .filter((item) => item.itemCode && item.itemCode.trim() !== '')
      .map((item) => ({
        value: item.itemCode ?? '',
        label: `${item.itemCode} - ${item.name}`,
      }));

    return NextResponse.json({ success: true, data: componentCodes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch component codes' },
      { status: 500 }
    );
  }
}
