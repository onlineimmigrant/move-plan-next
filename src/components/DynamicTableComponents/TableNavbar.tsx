// admin/components/DynamicTableComponents/TableNavbar.tsx
import React from "react";
import IconButton from "./IconButton";
import {
  PlusIcon,
  ViewColumnsIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  Bars3BottomLeftIcon,
  AdjustmentsVerticalIcon,
  CubeTransparentIcon,
  ChartBarIcon, // Added for reports
} from "@heroicons/react/24/outline";

interface TableNavbarProps {
  setIsFilterOpen: (open: boolean) => void;
  setIsSortOpen: (open: boolean) => void;
  setIsColumnsMenuOpen: (open: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsImportModalOpen: (open: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsAddColumnModalOpen: (open: boolean) => void;
  setIsSchemaModalOpen: (isOpen: boolean) => void;
  isFilterOpen: boolean;
  isSortOpen: boolean;
  isColumnsMenuOpen: boolean;
  isModalOpen: boolean;
  isImportModalOpen: boolean;
  isExportModalOpen: boolean;
  isAddColumnModalOpen: boolean;
  grayButtonClass: string;
  primaryButtonClass: string;
  tableName: string; // Added to pass the current table name
}

interface ButtonConfig {
  key: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tooltip: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const TableNavbar: React.FC<TableNavbarProps> = ({
  setIsFilterOpen,
  setIsSortOpen,
  setIsColumnsMenuOpen,
  setIsModalOpen,
  setIsImportModalOpen,
  setIsExportModalOpen,
  setIsAddColumnModalOpen,
  setIsSchemaModalOpen,
  isFilterOpen,
  isSortOpen,
  isColumnsMenuOpen,
  isModalOpen,
  isImportModalOpen,
  isExportModalOpen,
  isAddColumnModalOpen,
  grayButtonClass,
  primaryButtonClass,
  tableName, // Destructure the new prop
}) => {
  const defaultButtonClass = "p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200";

  const closeAllOthers = (exclude: string) => {
    const setters = {
      filter: setIsFilterOpen,
      sort: setIsSortOpen,
      columns: setIsColumnsMenuOpen,
      add: setIsModalOpen,
      import: setIsImportModalOpen,
      export: setIsExportModalOpen,
      "add-column": setIsAddColumnModalOpen,
    };
    Object.entries(setters).forEach(([key, setter]) => {
      if (key !== exclude) setter(false);
    });
  };

  const actionButtons: ButtonConfig[] = [
    {
      key: "add",
      icon: PlusIcon,
      tooltip: "Add Row",
      isActive: isModalOpen,
      onClick: () => {
        closeAllOthers("add");
        setIsModalOpen(true);
      },
    },
    {
      key: "add-column",
      icon: ViewColumnsIcon,
      tooltip: "Add Column",
      isActive: isAddColumnModalOpen,
      onClick: () => {
        closeAllOthers("add-column");
        setIsAddColumnModalOpen(true);
      },
    },
    {
      key: "import",
      icon: ArrowUpTrayIcon,
      tooltip: "CSV Import",
      isActive: isImportModalOpen,
      onClick: () => {
        closeAllOthers("import");
        setIsImportModalOpen(true);
      },
    },
    {
      key: "export",
      icon: ArrowDownTrayIcon,
      tooltip: "CSV Export",
      isActive: isExportModalOpen,
      onClick: () => {
        closeAllOthers("export");
        setIsExportModalOpen(true);
      },
    },
  ];

  const controlButtons: ButtonConfig[] = [
    {
      key: "filter",
      icon: FunnelIcon,
      tooltip: "Filter",
      isActive: isFilterOpen,
      onClick: () => {
        closeAllOthers("filter");
        setIsFilterOpen(!isFilterOpen);
      },
    },
    {
      key: "sort",
      icon: Bars3BottomLeftIcon,
      tooltip: "Sort",
      isActive: isSortOpen,
      onClick: () => {
        closeAllOthers("sort");
        setIsSortOpen(!isSortOpen);
      },
    },
    {
      key: "columns",
      icon: AdjustmentsVerticalIcon,
      tooltip: "Columns",
      isActive: isColumnsMenuOpen,
      onClick: () => {
        closeAllOthers("columns");
        setIsColumnsMenuOpen(!isColumnsMenuOpen);
      },
    },
    {
      key: "schema",
      icon: CubeTransparentIcon,
      tooltip: "View Schema",
      isActive: false,
      onClick: () => setIsSchemaModalOpen(true),
      className: grayButtonClass,
    },
    {
      key: "report",
      icon: ChartBarIcon, // New icon for reports
      tooltip: "View Report",
      isActive: false,
      onClick: () => {
        window.open(`/admin/reports/${tableName}`, "_blank"); // Open in new window
      },
      className: grayButtonClass,
    },
  ];

  const renderButtonGroup = (buttons: ButtonConfig[]) => (
    <div className="flex gap-1 sm:gap-4">
      {buttons.map((button) => (
        <IconButton
          key={button.key}
          onClick={button.onClick}
          icon={button.icon}
          tooltip={button.tooltip}
          isActive={button.isActive}
          className={button.className || defaultButtonClass}
        />
      ))}
    </div>
  );

  return (
    <div className="flex justify-between items-center mb-2">
      {renderButtonGroup(actionButtons)}
      {renderButtonGroup(controlButtons)}
    </div>
  );
};

export default TableNavbar;