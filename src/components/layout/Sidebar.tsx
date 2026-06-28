"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import {
  LayoutDashboard,
  Package,
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
  Bell,
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
  { label: "Machines", icon: Warehouse, href: "/machines", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Supplier PO - Admin, Store Manager
  { label: "Supplier PO", icon: FileText, href: "/supplier-po", roles: ["ADMIN", "STORE_MANAGER"] },
  
  // Request - Sub Store, Admin, Store Manager
  { label: "Request", icon: FileText, href: "/request", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"] },
  
  // Incoming Requests - Admin, Store Manager (of default store)
  { label: "Incoming Requests", icon: Bell, href: "/incoming-requests", roles: ["ADMIN", "STORE_MANAGER"], showNotification: true },
  
  // Production Entry - Sub Store, Admin, Store Manager
  { label: "Production Entry", icon: Package, href: "/production", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"] },
  
  // Component Product Process - Sub Store, Admin, Store Manager
  { label: "Product Process", icon: FileText, href: "/product-process", roles: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER", "EMPLOYEE"] },
  
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
  const [userStore, setUserStore] = useState<any>(null);
  const [defaultStore, setDefaultStore] = useState<any>(null);
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session?details=true")
      .then(res => res.json())
      .then(data => {
        if (data.role) {
          setUserRole(data.role);
        }
        if (data.store) {
          setUserStore(data.store);
        }
      })
      .catch(() => {
        setUserRole(null);
        setUserStore(null);
      });
  }, []);

  useEffect(() => {
    fetch("/api/stores/default")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setDefaultStore(data.data);
        }
      })
      .catch(() => setDefaultStore(null));
  }, []);

  useEffect(() => {
    if (defaultStore?.id && userRole === "ADMIN" && userStore?.id === defaultStore.id) {
      fetch(`/api/requests/incoming/count?storeId=${defaultStore.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIncomingRequestCount(data.data.count);
          }
        })
        .catch(() => setIncomingRequestCount(0));

      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        fetch(`/api/requests/incoming/count?storeId=${defaultStore.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setIncomingRequestCount(data.data.count);
            }
          })
          .catch(() => {});
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [defaultStore?.id, userRole, userStore?.id]);

  const navItems = allNavItems.filter(item => {
    // Check if user has the required role
    if (!userRole || !item.roles.includes(userRole)) {
      return false;
    }
    
    // Special check for Incoming Requests - only show for default store admin
    if (item.label === "Incoming Requests") {
      // Only show for ADMIN of the default store
      if (userRole !== "ADMIN") {
        return false;
      }
      // Check if user is associated with the default store
      if (defaultStore && userStore && userStore.id === defaultStore.id) {
        return true;
      }
      return false;
    }
    
    return true;
  });

  const NavContent = () => (
    <>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Smart Product
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Inventory</h1>
      </div>
      <nav className="space-y-3">
        {navItems.map((item: any) => (
          <div key={item.label} className="relative">
            <Link
              href={item.href}
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.showNotification && incomingRequestCount > 0 && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {incomingRequestCount > 99 ? "99+" : incomingRequestCount}
                </span>
              )}
            </Link>
          </div>
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