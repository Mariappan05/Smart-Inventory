"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  QrCode,
  FileText,
  Shield,
  Wrench,
  Users,
  ArrowLeftRight,
  Building2,
  Tag,
  Warehouse,
  UserCircle,
  Calendar,
} from "lucide-react";

const allNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", roles: ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER", "EMPLOYEE", "SUB_STORE_LOGIN", "INWARD_PERSON", "OUTWARD_PERSON"] },
  
  // Monthly Plan - Admin, Admin Manager, Store Manager
  { label: "Monthly Plan", icon: Calendar, href: "/monthly-plan", roles: ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"] },
  
  // Inward - Inward Person, Admin, Store Manager
  { label: "Inward", icon: ArrowLeftRight, href: "/inward", roles: ["INWARD_PERSON", "ADMIN", "STORE_MANAGER"] },
  
  // Outward - Outward Person, Admin, Store Manager
  { label: "Outward", icon: ArrowLeftRight, href: "/outward", roles: ["OUTWARD_PERSON", "ADMIN", "STORE_MANAGER"] },
  
  // Supplier Schedule - Admin, Store Manager
  { label: "Supplier Schedule", icon: Calendar, href: "/schedules/supplier", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Supplier PO - Admin, Store Manager
  { label: "Supplier PO", icon: FileText, href: "/supplier-po", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // New Product Entry - Admin, Store Manager
  { label: "New Product", icon: Package, href: "/products/new", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // New Tool Entry - Admin, Store Manager
  { label: "New Tool", icon: Wrench, href: "/tools/new", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // New Supplier Entry - Admin, Store Manager
  { label: "New Supplier", icon: Tag, href: "/suppliers/new", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // New Store Entry - Admin only
  { label: "Stores", icon: Building2, href: "/stores", roles: ["ADMIN"] },
  
  // New Machine Entry - Admin, Store Manager
  { label: "New Machine", icon: Warehouse, href: "/machines/new", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // QR Code - Admin, Store Manager
  { label: "QR Code", icon: QrCode, href: "/qr", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Request - Sub Store, Admin, Store Manager
  { label: "Request", icon: FileText, href: "/products/request", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"] },
  
  // Weekly Schedule - Sub Store, Admin, Store Manager
  { label: "Weekly Schedule", icon: Calendar, href: "/schedules", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"] },
  
  // Production Entry - Sub Store, Admin, Store Manager
  { label: "Production Entry", icon: Package, href: "/production", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"] },
  
  // Alerts - Admin, Store Manager, Employee
  { label: "Alerts", icon: Shield, href: "/alerts", roles: ["ADMIN", "STORE_MANAGER", "EMPLOYEE"] },
  
  // Users - Admin only
  { label: "Users", icon: Users, href: "/users", roles: ["ADMIN"] },
  
  // Profile - All authenticated users
  { label: "Profile", icon: UserCircle, href: "/profile", roles: ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER", "EMPLOYEE", "SUB_STORE_LOGIN", "INWARD_PERSON", "OUTWARD_PERSON"] },
];

export function Sidebar() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data.role) {
          setUserRole(data.role);
        }
      })
      .catch(() => setUserRole(null));
  }, []);

  const navItems = allNavItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <aside className="hidden w-64 flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-panel backdrop-blur lg:flex dark:border-slate-700 dark:bg-slate-900/70">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Smart Product
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Inventory</h1>
      </div>
      <nav className="space-y-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
