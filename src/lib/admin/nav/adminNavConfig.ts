import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Image,
  LayoutDashboard,
  Package,
  Percent,
  Settings,
  ShoppingBag,
  Store,
} from "lucide-react";

export type AdminNavLiveEntry = {
  kind: "live";
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  match: "exact" | "prefix";
};

export type AdminNavSoonEntry = {
  kind: "soon";
  id: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavEntry = AdminNavLiveEntry | AdminNavSoonEntry;

export const ADMIN_NAV_ENTRIES: AdminNavEntry[] = [
  {
    kind: "live",
    id: "dashboard",
    label: "דשבורד",
    href: "/admin",
    icon: LayoutDashboard,
    match: "exact",
  },
  {
    kind: "live",
    id: "orders",
    label: "הזמנות",
    href: "/admin/orders",
    icon: ShoppingBag,
    match: "prefix",
  },
  {
    kind: "live",
    id: "site-content",
    label: "תוכן האתר",
    href: "/admin/content",
    icon: FileText,
    match: "prefix",
  },
  {
    kind: "live",
    id: "materials",
    label: "חומרים",
    href: "/admin/materials",
    icon: Package,
    match: "prefix",
  },
  {
    kind: "live",
    id: "promotions",
    label: "מבצעים",
    href: "/admin/promotions",
    icon: Percent,
    match: "prefix",
  },
  {
    kind: "live",
    id: "backgrounds",
    label: "רקעים",
    href: "/admin/backgrounds",
    icon: Image,
    match: "prefix",
  },
  {
    kind: "live",
    id: "store-settings",
    label: "הגדרות חנות",
    href: "/admin/store-settings",
    icon: Store,
    match: "prefix",
  },
  {
    kind: "soon",
    id: "settings",
    label: "הגדרות",
    icon: Settings,
  },
];

export function isAdminNavActive(pathname: string, entry: AdminNavLiveEntry): boolean {
  if (entry.match === "exact") {
    return pathname === entry.href;
  }
  return pathname === entry.href || pathname.startsWith(`${entry.href}/`);
}
