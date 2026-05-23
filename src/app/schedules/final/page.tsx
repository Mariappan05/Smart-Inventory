import { AppShell } from "@/components/layout/AppShell";
import { FinalScheduleView } from "@/views/schedules/FinalScheduleView";

export const metadata = {
  title: "Final Schedule - Smart Inventory",
  description: "Manage final schedules and mark as completed",
};

export default function FinalSchedulePage() {
  return (
    <AppShell>
      <FinalScheduleView />
    </AppShell>
  );
}
