import { redirect } from "next/navigation";

export const metadata = {
  title: "Categories - Smart Inventory",
  description: "Manage machine categories",
};

export default async function CategoriesPage() {
  redirect("/types");
}
