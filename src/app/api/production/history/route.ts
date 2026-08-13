import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

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

    // Build where clause with store-based access control
    const storeFilter: any = {};

    // Apply store filtering based on user role
    if (user.role === 'STORE_MANAGER' || user.role === 'SUB_STORE_LOGIN' || user.role === 'EMPLOYEE') {
      if (user.storeId) {
        storeFilter.storeId = user.storeId;
      }
    }

    // 1. Fetch Product Information from Item table (Products are Items with PRODUCT_ prefix)
    const productInfo = await prisma.item.findFirst({
      where: {
        itemCode: componentCode,
        description: {
          startsWith: 'PRODUCT_',
        },
        ...storeFilter,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // 2. Fetch Tools linked to this component
    const tools = await prisma.tool.findMany({
      where: {
        item: {
          itemCode: componentCode,
        },
        ...storeFilter,
      },
      include: {
        item: {
          select: {
            itemCode: true,
            name: true,
          },
        },
        store: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Fetch Production records
    const productions = await prisma.production.findMany({
      where: {
        componentCode,
        ...storeFilter,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            employeeNo: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        productInfo,
        tools,
        productions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch production history' },
      { status: 500 }
    );
  }
}
