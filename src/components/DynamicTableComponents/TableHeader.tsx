import React, { useState } from "react";

import { Item } from "./types"; // Assuming Item type is defined in types.ts

interface TableHeaderProps {
  fields: string[];
  hiddenFields: string[];
  columnTypes: { [key: string]: string };
  handleColumnDragStart: (e: React.DragEvent<HTMLTableHeaderCellElement>, field: string) => void;
  handleColumnDragOver: (e: React.DragEvent<HTMLTableHeaderCellElement>) => void;
  handleColumnDrop: (e: React.DragEvent<HTMLTableHeaderCellElement>, targetField: string) => void;
  hideColumn: (field: string) => void;
  selectedRows: string[];
  items: Item[];
  setSelectedRows: (rows: string[]) => void;
  setIsAddColumnModalOpen: (open: boolean) => void;
  setIsEditColumnModalOpen: (open: boolean) => void;
  setIsDeleteColumnModalOpen: (open: boolean) => void;
  setSelectedColumn: (column: string | null) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  fields,
  hiddenFields,
  columnTypes,
  handleColumnDragStart,
  handleColumnDragOver,
  handleColumnDrop,
  hideColumn,
  selectedRows,
  items,
  setSelectedRows,
  setIsAddColumnModalOpen,
  setIsEditColumnModalOpen,
  setIsDeleteColumnModalOpen,
  setSelectedColumn,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Handle dropdown toggle
  const toggleDropdown = (field: string) => {
    setDropdownOpen((prev) => (prev === field ? null : field));
  };

  return (
    <thead>
      <tr className="bg-gray-100 text-gray-900 border-b border-gray-200">
        <th className="px-2 py-2 text-left text-xs border-r border-gray-200 w-10">
          <input
            type="checkbox"
            checked={selectedRows.length === items.length && items.length > 0}
            onChange={() =>
              setSelectedRows(
                selectedRows.length === items.length ? [] : items.map((item) => item.id)
              )
            }
          />
        </th>
        {fields.map((field) =>
          !hiddenFields.includes(field) && (
            <th
              key={field}
              className="group relative px-4 py-2 text-left font-medium text-xs border-r border-gray-200 cursor-move"
              draggable
              onDragStart={(e) => handleColumnDragStart(e, field)}
              onDragOver={handleColumnDragOver}
              onDrop={(e) => handleColumnDrop(e, field)}
            >
              <div className="flex items-center justify-between space-x-2">
                <div className="space-x-2">
                <span className="text-gray-700 font-medium">
                  {field}
                </span>
                <span className="text-gray-400 text-[11px] font-light">
                  {columnTypes[field] || "unknown"}
                </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(field)}
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {dropdownOpen === field && (
                    <div className="font-medium text-[11px] absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button
                        onClick={() => {
                          hideColumn(field);
                          setDropdownOpen(null);
                        }}
                        className="block w-full text-left px-4 py-2  text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg
                          className="h-4 w-4 mr-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 21c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c-4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                        Hide Column
                      </button>
                      <button
                        onClick={() => {
                          console.log("Setting selected column to:", field);
                          setSelectedColumn(field);
                          setIsEditColumnModalOpen(true);
                          setDropdownOpen(null);
                        }}
                        className="border-t border-gray-100 block w-full text-left px-4 py-2  text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg
                          className="h-4 w-4 mr-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828L15.172 4.586z"
                          />
                        </svg>
                        Edit Column
                      </button>
                      <button
                        onClick={() => {
                          console.log("Setting selected column to:", field);
                          setSelectedColumn(field);
                          setIsDeleteColumnModalOpen(true);
                          setDropdownOpen(null);
                        }}
                        className="border-t border-gray-100 block w-full text-left px-4 py-2  text-rose-500 hover:bg-gray-100 flex items-center"
                      >
                        <svg
                          className="h-4 w-4 mr-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"
                          />
                        </svg>
                        Delete Column
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </th>
          ))}
          <th className="border-b p-2 text-left text-sm font-medium text-gray-700 w-12">
            <button
              onClick={() => setIsAddColumnModalOpen(true)}
              className="text-gray-500 hover:text-gray-700 flex items-center"
              title="Add Column"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </th>
        </tr>
      </thead>
    );
};

export default TableHeader;