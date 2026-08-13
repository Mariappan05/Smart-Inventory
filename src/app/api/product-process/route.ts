import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/product-process?componentCode=XXX
 * Returns product info, tools, and production records for a component code.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    const { searchParams } = new URL(request.url);
    const componentCode = searchParams.get('componentCode');
    const productId = searchParams.get('productId');

    // Build store filter for access control
    const storeFilter: Record<string, string> = {};
    if (
      session.role === 'STORE_MANAGER' ||
      session.role === 'SUB_STORE_LOGIN' ||
      session.role === 'EMPLOYEE'
    ) {
      if (session.storeId) {
        storeFilter.storeId = session.storeId;
      }
    }

    if (productId) {
      // Fetch processes for specific product
      const processes = await prisma.productProcess.findMany({
        where: { productId, ...storeFilter },
        include: {
          product: { select: { id: true, name: true, itemCode: true } },
          tool: { select: { id: true, toolName: true, toolType: true } },
          store: { select: { id: true, name: true, code: true } },
          createdBy: { select: { name: true, employeeNo: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: processes });
    }

    // Fetch product info by componentCode (legacy production-history path)
    const productInfo = await prisma.item.findFirst({
      where: {
        itemCode: componentCode || undefined,
        description: { startsWith: 'PRODUCT_' },
        ...storeFilter,
      },
      include: {
        store: { select: { id: true, name: true, code: true } },
      },
    });

    const tools = await prisma.tool.findMany({
      where: {
        item: { itemCode: componentCode || undefined },
        ...storeFilter,
      },
      include: {
        item: { select: { itemCode: true, name: true } },
        store: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const productions = await prisma.production.findMany({
      where: {
        componentCode: componentCode || '',
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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product process data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const session = authResult;

    const body = await request.json();
    const {
      productId, partName, operation, machineType,
      holderType, holderName, collet, colletType,
      toolType, cutter, toolId, toolName,
      consumableScrew, consumable, supplierName, supplierCode, storeId,
    } = body;

    if (!productId || !partName || !operation || !machineType || !toolType) {
      return NextResponse.json(
        { success: false, error: 'Product, Part Name, Operation, Machine Type, and Tool Type are required' },
        { status: 400 }
      );
    }

    const process = await prisma.productProcess.create({
      data: {
        productId, partName, operation, machineType,
        holderType: holderType || null,
        holderName: holderName || null,
        collet: collet || null,
        colletType: colletType || null,
        toolType,
        cutter: cutter || null,
        toolId: toolId || null,
        toolName: toolName || null,
        consumableScrew: consumableScrew || null,
        consumable: consumable || null,
        supplierName: supplierName || null,
        supplierCode: supplierCode || null,
        storeId: storeId || session.storeId || null,
        createdById: session.userId,
      },
      include: {
        product: { select: { id: true, name: true, itemCode: true } },
        tool: { select: { id: true, toolName: true } },
      },
    });

    return NextResponse.json({ success: true, data: process });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create process' },
      { status: 500 }
    );
  }
}
