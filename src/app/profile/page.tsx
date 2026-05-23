import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/views/profile/ProfileView";

export const metadata = {
  title: "Profile - Smart Inventory",
};

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Account
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">My Profile</h1>
        </div>
        <ProfileView />
      </div>
    </AppShell>
  );
}
