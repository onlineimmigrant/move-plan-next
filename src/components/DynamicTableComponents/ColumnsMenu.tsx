import React, { useState, useEffect, useRef } from "react";

interface ColumnsMenuProps {
  isColumnsMenuOpen: boolean;
  setIsColumnsMenuOpen: (open: boolean) => void;
  fields: string[];
  hiddenFields: string[];
  toggleColumnVisibility: (field: string) => void;
}

const ColumnsMenu: React.FC<ColumnsMenuProps> = ({
  isColumnsMenuOpen,
  setIsColumnsMenuOpen,
  fields,
  hiddenFields,
  toggleColumnVisibility,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset position to center when the modal opens
  useEffect(() => {
    if (isColumnsMenuOpen) {
      // Center the modal on the viewport
      setPosition({ x: 0, y: 0 }); // Will be adjusted by CSS transform
    }
  }, [isColumnsMenuOpen]);

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

  if (!isColumnsMenuOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-10 bg-white border border-gray-200 rounded-md shadow-lg p-6 w-96 max-h-96 overflow-y-auto"
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
        <h3 className="text-lg font-semibold text-gray-900">Columns</h3>
        <button
          onClick={() => setIsColumnsMenuOpen(false)}
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
      {fields.map((field) => (
        <div key={field} className="flex items-center mb-2">
          <button onClick={() => toggleColumnVisibility(field)} className="mr-2">
            <svg
              className={`h-4 w-4 ${hiddenFields.includes(field) ? "text-gray-300" : "text-gray-500"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth="1.5"
            >
              {hiddenFields.includes(field) ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88a3 3 0 104.24 4.24M10.73 5.08A10.43 10.43 0 0112 5c4.48 0 8.27 2.94 9.54 7a11.77 11.77 0 01-2.2 3.68M6.27 6.27A10.43 10.43 0 005 12c1.27 4.06 5.06 7 9.54 7a10.43 10.43 0 003.68-2.2" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
          </button>
          <span className="text-xs text-gray-600 truncate">{field}</span>
        </div>
      ))}
    </div>
  );
};

export default ColumnsMenu;