'use client';

import React from 'react';
import IconButton from './IconButton';
import {
  PlusIcon,
  ViewColumnsIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  Bars3BottomLeftIcon,
  AdjustmentsVerticalIcon,
  CubeTransparentIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

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
  tableName: string;
  isLoading: boolean;
  pageSortingComponent: React.ReactElement;
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
  tableName,
  isLoading,
  pageSortingComponent,
}) => {
  const defaultButtonClass =
    'p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200';

  const closeAllOthers = (exclude: string) => {
    const setters = {
      filter: setIsFilterOpen,
      sort: setIsSortOpen,
      columns: setIsColumnsMenuOpen,
      add: setIsModalOpen,
      import: setIsImportModalOpen,
      export: setIsExportModalOpen,
      'add-column': setIsAddColumnModalOpen,
    };
    Object.entries(setters).forEach(([key, setter]) => {
      if (key !== exclude) setter(false);
    });
  };

  const actionButtons: ButtonConfig[] = [
    {
      key: 'add',
      icon: PlusIcon,
      tooltip: 'Add Row',
      isActive: isModalOpen,
      onClick: () => {
        closeAllOthers('add');
        setIsModalOpen(true);
      },
      className: primaryButtonClass,
    },
    {
      key: 'add-column',
      icon: ViewColumnsIcon,
      tooltip: 'Add Column',
      isActive: isAddColumnModalOpen,
      onClick: () => {
        closeAllOthers('add-column');
        setIsAddColumnModalOpen(true);
      },
    },
    {
      key: 'import',
      icon: ArrowUpTrayIcon,
      tooltip: 'CSV Import',
      isActive: isImportModalOpen,
      onClick: () => {
        closeAllOthers('import');
        setIsImportModalOpen(true);
      },
    },
    {
      key: 'export',
      icon: ArrowDownTrayIcon,
      tooltip: 'CSV Export',
      isActive: isExportModalOpen,
      onClick: () => {
        closeAllOthers('export');
        setIsExportModalOpen(true);
      },
    },
  ];

  const controlButtons: ButtonConfig[] = [
    {
      key: 'filter',
      icon: FunnelIcon,
      tooltip: 'Filter',
      isActive: isFilterOpen,
      onClick: () => {
        closeAllOthers('filter');
        setIsFilterOpen(!isFilterOpen);
      },
    },
    {
      key: 'sort',
      icon: Bars3BottomLeftIcon,
      tooltip: 'Sort',
      isActive: isSortOpen,
      onClick: () => {
        closeAllOthers('sort');
        setIsSortOpen(!isSortOpen);
      },
    },
    {
      key: 'columns',
      icon: AdjustmentsVerticalIcon,
      tooltip: 'Columns',
      isActive: isColumnsMenuOpen,
      onClick: () => {
        closeAllOthers('columns');
        setIsColumnsMenuOpen(!isColumnsMenuOpen);
      },
    },
    {
      key: 'schema',
      icon: CubeTransparentIcon,
      tooltip: 'View Schema',
      isActive: false,
      onClick: () => setIsSchemaModalOpen(true),
      className: grayButtonClass,
    },
    {
      key: 'report',
      icon: ChartBarIcon,
      tooltip: 'View Report',
      isActive: false,
      onClick: () => {
        window.open(`/admin/reports/${tableName}`, '_blank');
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
          disabled={isLoading}
        />
      ))}
    </div>
  );

  return (
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center space-x-4">
        {renderButtonGroup(actionButtons)}
        {isLoading && (
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-5 w-5 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
              ></path>
            </svg>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {renderButtonGroup(controlButtons)}
     
      </div>
    </div>
  );
};

export default TableNavbar;