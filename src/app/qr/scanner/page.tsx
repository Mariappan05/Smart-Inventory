import { AppShell } from "@/components/layout/AppShell";
import { QRScannerView } from "@/views/qr/QRScannerView";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { authCookieName } from "@/lib/auth/session";

export const metadata = {
  title: "QR Scanner - Smart Inventory",
  description: "Scan and validate machine QR codes",
};

export default async function QRScannerPage() {
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

  // Check if user has access (Store Manager, Admin)
  if (!token || !userRole || !["STORE_MANAGER", "ADMIN"].includes(userRole)) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="mt-2 text-sm text-red-800">
              You do not have permission to access the QR Scanner.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">QR Operations</p>
          <h1 className="text-3xl font-semibold text-slate-900">Scanner</h1>
        </div>
        <QRScannerView />
      </div>
    </AppShell>
  );
}
