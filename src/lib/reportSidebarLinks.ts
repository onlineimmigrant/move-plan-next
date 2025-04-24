export type DisclosureKey = "tables" | "custom";

// Define the LinkItem type
export type LinkItem = {
  href: string;
  label: string;
};

export const reportSidebarLinks: Record<DisclosureKey, LinkItem[]> = {
  tables: [
    { href: "/admin/reports/product", label: "Products" },
    { href: "/admin/reports/pricingplan", label: "Pricing Plans" },
    { href: "/admin/reports/product_type", label: "Product Types" },
    { href: "/admin/reports/product_sub_type", label: "Product Sub Types" },
    { href: "/admin/reports/feature", label: "Features" },
    { href: "/admin/reports/faq", label: "FAQ" },
    { href: "/admin/reports/countries", label: "Countries" },
    { href: "/admin/reports/currency", label: "Currencies" },
    { href: "/admin/reports/todo", label: "To-Do" },
    { href: "/admin/reports/item_types", label: "Item Types" },
    { href: "/admin/reports/settings", label: "Settings" },
  ],
  custom: [
    { href: "/admin/reports/custom", label: "Constructor" },
  ],
};