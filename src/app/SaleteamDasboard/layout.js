"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Globe2,
  LayoutDashboard,
  Menu,
  Package,
  ReceiptText,
  ShoppingCart,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";

const baseGroups = (role) => [
  {
    title: "Overview",
    links: [{ label: "Dashboard", icon: LayoutDashboard, href: "/SaleteamDasboard/Dasboard" }],
  },
  ...(role === "Lead filler" ? [{
    title: "Leads",
    links: [
      { label: "Enter Enquiry", icon: ClipboardList, href: "/SaleteamDasboard/Enquirypage" },
      { label: "View Leads", icon: Eye, href: "/SaleteamDasboard/Leadenquiryview" },
      { label: "Product Enquiries", icon: Globe2, href: "/SaleteamDasboard/ProductEnquiries" },
    ],
  }] : []),
  {
    title: "Sales",
    links: [
      { label: "Converted", icon: CheckCircle2, href: "/SaleteamDasboard/CustomerConverted" },
      { label: "Not Converted", icon: XCircle, href: "/SaleteamDasboard/Cnc" },
      { label: "Customers", icon: Users, href: "/SaleteamDasboard/Getcustomerdetails" },
      { label: "Quotations", icon: FileText, href: "/SaleteamDasboard/GetEidQuotation" },
    ],
  },
  {
    title: "Procurement",
    links: [
      { label: "Inventory", icon: Boxes, href: "/SaleteamDasboard/Inventory" },
      { label: "Purchase Orders", icon: ShoppingCart, href: "/SaleteamDasboard/GetPO" },
      { label: "Proforma Invoices", icon: ReceiptText, href: "/SaleteamDasboard/GetPI" },
    ],
  },
  {
    title: "Account",
    links: [{ label: "Profile", icon: UserRound, href: "/SaleteamDasboard/viewprofile" }],
  },
];

function isActive(pathname, href) {
  return pathname === href.split("?")[0];
}

function SidebarNav({ pathname, groups, onNavigate }) {
  return (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-5">
      {groups.map((group) => (
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
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={active ? "text-blue-600" : "text-slate-400"} />
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

export default function SalesLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
  }, []);

  const groups = baseGroups(role);

  return (
    <div className="flex flex-grow">
      {/* Desktop sidebar */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <SidebarNav pathname={pathname} groups={groups} />
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
              <SidebarNav pathname={pathname} groups={groups} onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
