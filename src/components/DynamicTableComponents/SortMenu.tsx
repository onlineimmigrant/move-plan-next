import React, { useState, useEffect, useRef } from "react";
import { SortCriteria } from "./types";

interface SortMenuProps {
  isSortOpen: boolean;
  setIsSortOpen: (open: boolean) => void;
  sortCriteria: SortCriteria | null;
  setSortCriteria: (criteria: SortCriteria | null) => void;
  fields: string[];
  applySort: (field: string, direction: "asc" | "desc") => void;
  clearSort: () => void;
  primaryButtonClass: string;
  grayButtonClass: string;
}

const SortMenu: React.FC<SortMenuProps> = ({
  isSortOpen,
  setIsSortOpen,
  sortCriteria,
  setSortCriteria,
  fields,
  applySort,
  clearSort,
  primaryButtonClass,
  grayButtonClass,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset position to center when the modal opens
  useEffect(() => {
    if (isSortOpen) {
      // Center the modal on the viewport
      setPosition({ x: 0, y: 0 }); // Will be adjusted by CSS transform
    }
  }, [isSortOpen]);

  // Handle dragging
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging, dragStart]);

  if (!isSortOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-10 bg-white border border-gray-200 rounded-md shadow-lg p-6 w-96"
      style={{
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <div
        className="flex justify-between items-center mb-4 cursor-grab"
        onMouseDown={handleDragStart}
      >
        <h3 className="text-lg font-semibold text-gray-900">Sort By</h3>
        <button
          onClick={() => setIsSortOpen(false)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <select
        className="border border-gray-300 p-2 text-xs rounded-md w-full mb-2"
        value={sortCriteria?.field || ""}
        onChange={(e) =>
          setSortCriteria((prev) => ({
            ...prev,
            field: e.target.value,
            direction: prev?.direction || "asc",
          }))
        }
      >
        <option value="">Select Field</option>
        {fields.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
      <select
        className="border border-gray-300 p-2 text-xs rounded-md w-full mb-4"
        value={sortCriteria?.direction || "asc"}
        onChange={(e) =>
          setSortCriteria((prev) => ({
            ...prev,
            field: prev?.field || fields[0],
            direction: e.target.value as "asc" | "desc",
          }))
        }
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => applySort(sortCriteria?.field || fields[0], sortCriteria?.direction || "asc")}
          className={primaryButtonClass}
        >
          Apply
        </button>
        <button onClick={clearSort} className={grayButtonClass}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default SortMenu;