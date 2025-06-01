import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  XMarkIcon,
  ChevronDownIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  ShoppingCartIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  NewspaperIcon,
  RssIcon,
  QuestionMarkCircleIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  ServerIcon,
  GlobeAltIcon,
  AtSymbolIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";

interface LinkItem {
  href?: string;
  label: string;
  children?: LinkItem[];
  isOpen?: boolean;
}

type DisclosureKey =
  | "users"
  | "sell"
  | "booking"
  | "app"
  | "consent_management"
  | "blog"
  | "edupro"
  | "quiz"
  | "feedback"
  | "ai"
  | "datacollection"
  | "website"
  | "email"
  | "settings";

interface TablesChildMenuProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  sidebarLinks: Record<DisclosureKey, LinkItem[]>;
  openSections: Record<DisclosureKey, boolean>;
  setOpenSections: React.Dispatch<React.SetStateAction<Record<DisclosureKey, boolean>>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const sectionIcons: Record<DisclosureKey, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  users: UsersIcon,
  sell: ShoppingCartIcon,
  booking: ShoppingBagIcon,
  app: DevicePhoneMobileIcon,
  consent_management: ShieldCheckIcon,
  edupro: AcademicCapIcon,
  quiz: QuestionMarkCircleIcon,
  feedback: NewspaperIcon,
  blog: RssIcon,
  ai: RocketLaunchIcon,
  datacollection: ServerIcon,
  website: GlobeAltIcon,
  email: AtSymbolIcon,
  settings: Cog6ToothIcon,
};

// Helper function to check if a section is active based on child hrefs
const isSectionActive = (pathname: string, links: LinkItem[]): boolean => {
  return links.some((link) => {
    if (link.href === pathname) return true;
    if (link.children) return isSectionActive(pathname, link.children);
    return false;
  });
};

const MenuItem = ({
  link,
  onClick,
  isTopLevel = false,
  isOpen: propIsOpen,
  toggleOpen,
}: {
  link: LinkItem;
  onClick: () => void;
  isTopLevel?: boolean;
  isOpen?: boolean;
  toggleOpen?: () => void;
}) => {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [isChildOpen, setIsChildOpen] = useState(isTopLevel ? link.isOpen || false : propIsOpen || false);
  const isActive = isTopLevel
    ? link.children && isSectionActive(pathname, link.children)
    : link.href
    ? pathname === link.href
    : false;
  const SectionIcon = isTopLevel
    ? sectionIcons[link.label.toLowerCase().replace(" ", "_") as DisclosureKey]
    : null;

  const linkClasses = cn(
    "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all hover:bg-gray-100",
    isActive ? "bg-gray-50" : "text-gray-600",
    isTopLevel && "px-6"
  );

  const iconClasses = cn(
    "w-4 h-4",
    isActive 
      ? `text-gray-700`
      : isActive
      ? "text-sky-600"
      : "text-gray-400"
  );

  const effectiveIsOpen = isTopLevel ? propIsOpen : isChildOpen;
  const effectiveToggle = isTopLevel ? toggleOpen : () => setIsChildOpen((prev) => !prev);

  return link.children?.length ? (
    <div className="flex flex-col">
      <button
        className={cn(
          "flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium rounded-md transition-all hover:bg-gray-50",
          effectiveIsOpen ? "bg-gray-50" : "text-gray-600",
          isTopLevel
            ? "text-gray-900 font-semibold py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
            : "text-gray-500 mt-1"
        )}
        onClick={effectiveToggle}
      >
        <span className={cn("flex gap-4 items-center", isTopLevel && "py-1.5")}>
          {SectionIcon && <SectionIcon className={iconClasses} />}
          {!isTopLevel && <span className="w-4" />}
          {link.label}
        </span>
        <span
          className={cn(
            "text-gray-400",
            isTopLevel && "h-3 w-3 transition-transform",
            effectiveIsOpen && "rotate-180"
          )}
        >
          {isTopLevel ? (
            <ChevronDownIcon className="h-3 w-3 text-gray-400" />
          ) : effectiveIsOpen ? (
            "−"
          ) : (
            "+"
          )}
        </span>
      </button>
      <div
        className={cn(
          "space-y-1 overflow-hidden transition-all duration-200 ease-in-out",
          effectiveIsOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
          isTopLevel && "mt-1 border-l-1 border-gray-100 pl-1",
          !isTopLevel && "mt-1 pl-7"
        )}
      >
        {link.children.map((child) => (
          <MenuItem key={child.href || child.label} link={child} onClick={onClick} />
        ))}
      </div>
    </div>
  ) : link.href ? (
    <Link href={link.href} onClick={onClick} className={linkClasses}>
      <span className={cn("text-xs w-4 h-4 flex justify-center", iconClasses)}>
        <TableCellsIcon />
      </span>
      <span className="tracking-wide text-xs">{link.label}</span>
    </Link>
  ) : null;
};

// Filter function
const filterSidebarLinks = (
  links: Record<DisclosureKey, LinkItem[]>,
  query: string
): { filtered: Record<DisclosureKey, LinkItem[]>; sectionsToOpen: DisclosureKey[] } => {
  if (!query) return { filtered: links, sectionsToOpen: [] };

  const filtered: Record<DisclosureKey, LinkItem[]> = {
    users: [],
    sell: [],
    booking: [],
    app: [],
    consent_management: [],
    blog: [],
    edupro: [],
    quiz: [],
    feedback: [],
    ai: [],
    datacollection: [],
    website: [],
    email: [],
    settings: [],
  };
  const sectionsToOpen: DisclosureKey[] = [];
  const lowerQuery = query.toLowerCase();

  Object.entries(links).forEach(([key, items]) => {
    const filteredItems: LinkItem[] = [];

    items.forEach((item) => {
      const itemMatches = item.label.toLowerCase().includes(lowerQuery);
      let hasNestedMatches = false;
      const filteredChildren = item.children?.map((child) => {
        const childMatches = child.label.toLowerCase().includes(lowerQuery);
        const nestedChildren = child.children?.map((nested) => {
          const nestedMatches = nested.label.toLowerCase().includes(lowerQuery);
          if (nestedMatches) hasNestedMatches = true;
          return nestedMatches ? { ...nested, isOpen: true } : nested;
        });
        const hasChildrenMatches = nestedChildren?.some((c) => c.label.toLowerCase().includes(lowerQuery));
        if (childMatches || hasChildrenMatches) {
          hasNestedMatches = true;
          return { ...child, children: nestedChildren, isOpen: childMatches || hasChildrenMatches };
        }
        return child;
      }) || [];

      if (itemMatches || hasNestedMatches) {
        filteredItems.push({ ...item, children: filteredChildren, isOpen: itemMatches || hasNestedMatches });
        sectionsToOpen.push(key as DisclosureKey);
      }
    });

    if (filteredItems.length) {
      filtered[key as DisclosureKey] = filteredItems;
    }
  });

  return { filtered, sectionsToOpen };
};

export default function TablesChildMenu({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarLinks,
  openSections,
  setOpenSections,
  searchQuery,
  setSearchQuery,
}: TablesChildMenuProps) {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { filtered: filteredLinks, sectionsToOpen } = useMemo(
    () => filterSidebarLinks(sidebarLinks, searchQuery),
    [sidebarLinks, searchQuery]
  );

  useEffect(() => {
    const newOpenSections = { ...openSections };
    let hasChanges = false;

    if (searchQuery) {
      sectionsToOpen.forEach((key) => {
        if (!newOpenSections[key]) {
          newOpenSections[key] = true;
          hasChanges = true;
        }
      });
    } else {
      Object.keys(newOpenSections).forEach((key) => {
        if (newOpenSections[key as DisclosureKey]) {
          newOpenSections[key as DisclosureKey] = false;
          hasChanges = true;
        }
      });
    }

    if (hasChanges) {
      setOpenSections(newOpenSections);
    }
  }, [searchQuery, sectionsToOpen, setOpenSections]);

  const toggleSection = (section: DisclosureKey) =>
    setOpenSections((prev: Record<DisclosureKey, boolean>) => ({
      ...prev,
      [section]: !prev[section],
    }));

  const mobileIconClasses = (key: DisclosureKey) =>
    cn(
      "h-4 w-4",
      isSectionActive(pathname, sidebarLinks[key]) 
        ? `text-gray-700`
        : isSectionActive(pathname, sidebarLinks[key])
        ? "text-sky-600"
        : "text-gray-400"
    );

  return (
    <>
      {/* Mobile narrow bar */}
      <div className="pt-6 z-48 md:hidden inset-y-0 left-14 w-12 bg-white border-gray-200 flex flex-col items-center py-4 gap-6 border-r">
        <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-md hover:bg-gray-50">
          <MagnifyingGlassIcon className="h-3 w-3 text-gray-600" />
        </button>
        {Object.keys(filteredLinks).map((key) => {
          const Icon = sectionIcons[key as DisclosureKey];
          return (
            <button
              key={key}
              onClick={() => {
                toggleSection(key as DisclosureKey);
                setIsSidebarOpen(true);
              }}
              className="p-1 rounded-md hover:bg-gray-50"
            >
              <Icon className={mobileIconClasses(key as DisclosureKey)} />
            </button>
          );
        })}
      </div>

      {/* Main sidebar */}
      <aside
        className={cn(
          " z-50 fixed inset-y-0 left-0 w-full px-8 sm:px-0 sm:w-72 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0 sm:ml-8" : "-translate-x-full",
          "md:static md:w-56 md:min-h-screen md:ml-0 md:translate-x-0 md:transition-none"
        )}
      >
        <div className="flex items-center justify-between p-4 px-2 border-gray-200">
          <div className="px-2 py-2 w-full">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>
          <button
            className="md:hidden p-1 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
            onClick={() => setIsSidebarOpen(false)}
          >
            <XMarkIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <nav className="flex flex-col gap-2 px-2 py-4 h-[calc(100vh-110px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {Object.entries(filteredLinks).map(([key, links]) => (
            <MenuItem
              key={key}
              link={{
                label: key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                children: links,
              }}
              onClick={() => setIsSidebarOpen(false)}
              isTopLevel
              isOpen={openSections[key as DisclosureKey]}
              toggleOpen={() => toggleSection(key as DisclosureKey)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}