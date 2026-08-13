import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.productProcess.update({
      where: { id },
      data: {
        partName: body.partName,
        operation: body.operation,
        machineType: body.machineType,
        holderType: body.holderType || null,
        holderName: body.holderName || null,
        collet: body.collet || null,
        colletType: body.colletType || null,
        toolType: body.toolType,
        cutter: body.cutter || null,
        toolId: body.toolId || null,
        toolName: body.toolName || null,
        consumableScrew: body.consumableScrew || null,
        consumable: body.consumable || null,
        supplierName: body.supplierName || null,
        supplierCode: body.supplierCode || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update process' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { id } = await params;

    await prisma.productProcess.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete process' }, { status: 500 });
  }
}
