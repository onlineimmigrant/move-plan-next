'use client';

import React, { RefObject } from 'react';
import IconButton from './IconButton';
import {
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/outline';
import { Item, EditingCell, ForeignKeyOption } from './types';

interface TableBodyProps {
  items: Item[];
  fields: string[];
  hiddenFields: string[];
  unchangeableFields: string[];
  selectedRows: string[];
  editingCell: EditingCell | null;
  editValue: string;
  foreignKeyOptions: { [key: string]: ForeignKeyOption[] };
  inputRefs: RefObject<(HTMLInputElement | null)[][]>;
  toggleRowSelection: (id: string) => void;
  startEditing: (id: string, field: string, value: string) => void;
  setEditValue: (value: string) => void;
  saveEdit: (id: string, field: string, originalValue: string) => void;
  cancelEdit: () => void;
  setToNull: (id: string, field: string) => void;
  onExpandRow: (item: Item) => void;
  setSelectedForeignKeyItem: (item: Item | null) => void;
  setIsForeignKeyModalOpen: (open: boolean) => void;
  pageSortingComponent?: React.ReactNode;
}

const TableBody: React.FC<TableBodyProps> = ({
  items,
  fields,
  hiddenFields,
  unchangeableFields,
  selectedRows,
  editingCell,
  editValue,
  foreignKeyOptions,
  inputRefs,
  toggleRowSelection,
  startEditing,
  setEditValue,
  saveEdit,
  cancelEdit,
  setToNull,
  onExpandRow,
  setSelectedForeignKeyItem,
  setIsForeignKeyModalOpen,
}) => {
  const visibleFields = fields.filter((field) => !hiddenFields.includes(field));

  const handleForeignKeyClick = (item: Item, field: string) => {
    setSelectedForeignKeyItem({ ...item, field });
    setIsForeignKeyModalOpen(true);
  };

  return (
    <tbody>
      {items.map((item, rowIndex) => {
        if (!inputRefs.current![rowIndex]) {
          inputRefs.current![rowIndex] = [];
        }
        return (
          <tr
            key={item.id}
            className="border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
          >
            <td className="px-2 py-2 text-xs border-r border-gray-200 w-16">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(item.id)}
                  onChange={() => toggleRowSelection(item.id)}
                />
                {selectedRows.includes(item.id) && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <IconButton
                      onClick={() => onExpandRow(item)}
                      icon={ChevronRightIcon}
                      tooltip="Expand"
                    />
                  </div>
                )}
              </div>
            </td>
            {visibleFields.map((field, colIndex) => (
              <td
                key={`${item.id}-${field}`}
                className={`px-4 py-2 text-xs border-r border-gray-200 ${
                  unchangeableFields.includes(field) ? 'bg-gray-100' : ''
                }`}
                onDoubleClick={() =>
                  !unchangeableFields.includes(field) &&
                  startEditing(item.id, field, item[field]?.toString() || '')
                }
              >
                {editingCell?.id === item.id &&
                editingCell?.field === field &&
                !unchangeableFields.includes(field) ? (
                  <div className="flex flex-col gap-2">
                    {field.endsWith('_id') && foreignKeyOptions[field] ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border border-gray-300 p-1 text-xs rounded-md w-full"
                      >
                        <option value="">Select...</option>
                        {foreignKeyOptions[field].map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        ref={(el) => {
                          inputRefs.current![rowIndex][colIndex] = el;
                        }}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border border-gray-300 p-1 text-xs rounded-md w-full"
                      />
                    )}
                    <div className="flex gap-2">
                      <IconButton
                        onClick={() =>
                          saveEdit(item.id, field, item[field]?.toString() || '')
                        }
                        disabled={editValue === (item[field]?.toString() || '')}
                        icon={CheckIcon}
                        tooltip="Save"
                      />
                      <IconButton
                        onClick={cancelEdit}
                        icon={XMarkIcon}
                        tooltip="Cancel"
                      />
                      <IconButton
                        onClick={() => setToNull(item.id, field)}
                        disabled={item[field] === null}
                        icon={MinusCircleIcon}
                        tooltip="NULL"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 block whitespace-nowrap overflow-hidden text-ellipsis">
                      {item[field]?.toString() || ''}
                    </span>
                    {field.endsWith('_id') && item[field] && (
                      <button
                        onClick={() => handleForeignKeyClick(item, field)}
                        className="text-gray-500 hover:text-gray-700"
                        title="View related record"
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
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l-4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
};

export default TableBody;