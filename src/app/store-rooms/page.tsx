import { redirect } from "next/navigation";

export const metadata = {
  title: "Store Rooms - Smart Inventory",
  description: "Manage store rooms",
};

export default async function StoreRoomsPage() {
  redirect("/stores");
}
