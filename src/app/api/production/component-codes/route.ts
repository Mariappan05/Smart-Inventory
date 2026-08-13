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

    // Get unique item codes from Items table (Products with PRODUCT_ prefix)
    // Apply store filtering based on user role
    const whereClause: any = {
      description: {
        startsWith: 'PRODUCT_',
      },
    };

    if (user.role === 'STORE_MANAGER' || user.role === 'SUB_STORE_LOGIN' || user.role === 'EMPLOYEE') {
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
      .filter(item => item.itemCode && item.itemCode.trim() !== '')
      .map(item => ({
        value: item.itemCode || '',
        label: `${item.itemCode} - ${item.name}`,
      }));

    return NextResponse.json({
      success: true,
      data: componentCodes,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch component codes' },
      { status: 500 }
    );
  }
}
