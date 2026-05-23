"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
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
  
  // Products - Admin, Store Manager
  { label: "Products", icon: Package, href: "/products", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Tools - Admin, Store Manager
  { label: "Tools", icon: Wrench, href: "/tools", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Suppliers - Admin, Store Manager
  { label: "Suppliers", icon: Tag, href: "/suppliers/new", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Machines - Admin, Store Manager
  { label: "Machines", icon: Warehouse, href: "/machines/new", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Supplier Schedule - Admin, Store Manager
  { label: "Supplier Schedule", icon: Calendar, href: "/schedules/supplier", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Supplier PO - Admin, Store Manager
  { label: "Supplier PO", icon: FileText, href: "/supplier-po", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // QR Code - Admin, Store Manager
  { label: "QR Code", icon: QrCode, href: "/qr", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Machine IO - Admin, Store Manager
  { label: "Machine IO", icon: ArrowLeftRight, href: "/machine-io", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Request - Sub Store, Admin, Store Manager
  { label: "Request", icon: FileText, href: "/request", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"] },
  
  // Weekly Schedule - Sub Store, Admin, Store Manager
  { label: "Weekly Schedule", icon: Calendar, href: "/schedules", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"] },
  
  // Production Entry - Sub Store, Admin, Store Manager
  { label: "Production Entry", icon: Package, href: "/production", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"] },
  
  // Categories - Admin, Store Manager
  { label: "Categories", icon: Tag, href: "/categories", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Store Rooms - Admin, Store Manager
  { label: "Store Rooms", icon: Warehouse, href: "/store-rooms", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Maintenance - Admin, Store Manager
  { label: "Maintenance", icon: Wrench, href: "/maintenance", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Reports - Admin, Store Manager
  { label: "Reports", icon: FileText, href: "/reports", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Alerts - Admin, Store Manager, Employee
  { label: "Alerts", icon: Shield, href: "/alerts", roles: ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER", "EMPLOYEE"] },
  
  // Stores - Admin only
  { label: "Stores", icon: Building2, href: "/stores", roles: ["ADMIN"] },
  
  // Users - Admin only
  { label: "Users", icon: Users, href: "/users", roles: ["ADMIN"] },
  
  // Profile - All authenticated users
  { label: "Profile", icon: UserCircle, href: "/profile", roles: ["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER", "EMPLOYEE", "SUB_STORE_LOGIN", "INWARD_PERSON", "OUTWARD_PERSON"] },
];

export function Sidebar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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

  const NavContent = () => (
    <>
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
            onClick={() => setMobileDrawerOpen(false)}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-panel backdrop-blur lg:flex dark:border-slate-700 dark:bg-slate-900/70">
        <NavContent />
      </aside>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
      >
        {mobileDrawerOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer */}
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 shadow-lg rounded-r-3xl border-r border-slate-200 dark:border-slate-700 overflow-y-auto z-40 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Smart Product
                </p>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Inventory</h1>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}