"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileText,
  KeyRound,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  Boxes,
  ReceiptText,
  ShoppingCart,
  UserPlus,
  Users,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Overview",
    links: [{ label: "Dashboard", icon: LayoutDashboard, href: "/admin/adminDasboard" }],
  },
  {
    title: "Sales",
    links: [
      { label: "Leads", icon: ClipboardList, href: "/admin/AllLeadEnquiry" },
      { label: "Customers", icon: Users, href: "/admin/Allcustomerget" },
      { label: "Quotation Requests", icon: FileText, href: "/admin/Quotation?EnquiryNo" },
      { label: "All Quotations", icon: FileText, href: "/admin/GetAllquotation" },
      { label: "Sales Orders", icon: BarChart3, href: "/admin/GetSO" },
      { label: "Converted Today", icon: CheckCircle2, href: "/admin/Yes" },
      { label: "Lost Today", icon: XCircle, href: "/admin/No" },
    ],
  },
  {
    title: "Procurement",
    links: [
      { label: "PO Requests", icon: ShoppingCart, href: "/admin/Purchaseorder" },
      { label: "Product Requests", icon: Package, href: "/admin/ProductRequest" },
      { label: "Proforma Invoices", icon: ReceiptText, href: "/admin/Invoice" },
      { label: "Inventory", icon: Boxes, href: "/SaleteamDasboard/Inventory" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Service Details", icon: Wrench, href: "/admin/ServiceDetails" },
      { label: "Work Visits", icon: BriefcaseBusiness, href: "/admin/GetAllworkvisit" },
      { label: "Resources", icon: FileText, href: "/admin/Getresources" },
    ],
  },
  {
    title: "Administration",
    links: [
      { label: "Employees", icon: Users, href: "/admin/viewallprofile" },
      { label: "Add Employee", icon: UserPlus, href: "/admin/register" },
      { label: "Reset Email", icon: Mail, href: "/admin/resetemail" },
      { label: "Reset Password", icon: KeyRound, href: "/admin/passwordreset" },
    ],
  },
];

function isActive(pathname, href) {
  return pathname === href.split("?")[0];
}

function SidebarNav({ pathname, onNavigate }) {
  return (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {group.title}
          </div>
          <div className="space-y-0.5">
            {group.links.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={active ? "text-teal-600" : "text-slate-400"} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-grow">
      {/* Desktop sidebar */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <SidebarNav pathname={pathname} />
      </aside>

      {/* Mobile: floating toggle + overlay drawer */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 rounded-full bg-slate-900 p-3 text-white shadow-lg lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Navigation</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
