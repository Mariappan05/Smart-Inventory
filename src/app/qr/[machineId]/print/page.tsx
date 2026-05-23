import { AppShell } from "@/components/layout/AppShell";
import { QRPrintView } from "@/views/qr/QRPrintView";
import { QRService } from "@/services/qrService";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

const qrService = new QRService();

type PageProps = {
  params: Promise<{ machineId: string }>;
};

async function getMachine(machineId: string) {
  return prisma.product.findUnique({
    where: { id: machineId },
    include: {
      type: true,
      supplier: true,
      store: true,
      item: true,
    },
  });
}

export default async function QRPrintPage({ params }: PageProps) {
  // Get auth token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  // Verify token and get user role
  let userRole: string | null = null;
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      userRole = payload.role;
    } catch {
      userRole = null;
    }
  }

  // Check if user has access (Admin, Admin Manager, Store Manager)
  if (!token || !["ADMIN", "STORE_MANAGER"].includes(userRole || "")) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              You do not have permission to access the QR Print page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { machineId } = await params;
  const machine = await getMachine(machineId);

  if (!machine) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          Machine not found.
        </div>
      </AppShell>
    );
  }

  const qr = await qrService.generateMachineQR(machineId, 1024);

  return (
    <AppShell>
      <QRPrintView
        machine={{
          id: machine.id,
          assetTag: machine.serial,
          name: machine.item?.name || machine.serial,
          status: machine.status,
          serial: machine.serial,
          category: machine.type,
          supplier: machine.supplier,
          storeRoom: machine.store,
        }}
        qrDataUrl={qr.dataUrl}
        qrPayload={qr.payload}
        fileName={qr.fileName}
      />
    </AppShell>
  );
}
