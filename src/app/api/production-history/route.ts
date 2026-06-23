import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

// Prevent Next.js static generation — this route requires auth + DB access
export const dynamic = 'force-dynamic';

/**
 * GET /api/production-history?componentCode=XXX
 *
 * Returns product info, tools, and production records for a component code.
 * Moved to a top-level route to avoid Vercel routing collision with
 * /api/production/[id] swallowing /api/production/history.
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

    const { searchParams } = new URL(request.url);
    const componentCode = searchParams.get('componentCode');

    if (!componentCode) {
      return NextResponse.json(
        { success: false, error: 'Component code is required' },
        { status: 400 }
      );
    }

    // Build store filter for access control
    const storeFilter: Record<string, string> = {};
    if (
      user.role === 'STORE_MANAGER' ||
      user.role === 'SUB_STORE_LOGIN' ||
      user.role === 'EMPLOYEE'
    ) {
      if (user.storeId) {
        storeFilter.storeId = user.storeId;
      }
    }

    // 1. Product Information
    const productInfo = await prisma.item.findFirst({
      where: {
        itemCode: componentCode,
        description: { startsWith: 'PRODUCT_' },
        ...storeFilter,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // 2. Tools linked to this component
    const tools = await prisma.tool.findMany({
      where: {
        item: { itemCode: componentCode },
        ...storeFilter,
      },
      include: {
        item: { select: { itemCode: true, name: true } },
        store: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Production records
    const productions = await prisma.production.findMany({
      where: {
        componentCode,
        ...storeFilter,
      },
      include: {
        store: { select: { id: true, name: true, code: true } },
        createdBy: { select: { name: true, employeeNo: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { productInfo, tools, productions },
    });
  } catch (error) {
    console.error('Error fetching production history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch production history' },
      { status: 500 }
    );
  }
}
