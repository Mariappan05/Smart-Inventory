import { AppShell } from "@/components/layout/AppShell";
import { ExpiredScheduleView } from "@/views/schedules/ExpiredScheduleView";

export const metadata = {
  title: "Expired Schedules - Smart Inventory",
  description: "View expired schedules",
};

export default function ExpiredSchedulePage() {
  return (
    <AppShell>
      <ExpiredScheduleView />
    </AppShell>
  );
}
