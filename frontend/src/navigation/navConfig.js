export const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: "dashboard",
    roles: ["MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"],
  },
  {
    label: "Customers",
    path: "/customers",
    icon: "customers",
    roles: ["MANAGER", "DISPATCHER"],
  },
  {
    label: "Sites",
    path: "/sites",
    icon: "sites",
    roles: ["MANAGER", "DISPATCHER"],
  },
  {
    label: "Work Orders",
    path: "/work-orders",
    icon: "workOrders",
    roles: ["MANAGER", "DISPATCHER", "TECHNICIAN"],
  },
  {
    label: "Parts",
    path: "/parts",
    icon: "parts",
    roles: ["TECHNICIAN"],
  },
  {
    label: "Time Tracking",
    path: "/time-tracking",
    icon: "timeTracking",
    roles: ["TECHNICIAN"],
  },
  {
    label: "SLA",
    path: "/sla",
    icon: "sla",
    roles: ["MANAGER", "DISPATCHER", "TECHNICIAN"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: "notifications",
    roles: ["MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"],
  },
];

export function getNavItems(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function findNavItem(pathname) {
  return NAV_ITEMS.find((item) => item.path === pathname) || null;
}