import React, { useState, useEffect } from "react";

interface ForeignKeyOption {
  id: string;
  name: string;
}

interface Item {
  id: string;
  [key: string]: any;
}

interface SchemaModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  tableName: string;
  fields: string[];
  columnTypes: { [key: string]: string };
  foreignKeys: { [key: string]: { relatedTable: string; relatedColumn: string } };
  foreignKeyOptions: { [key: string]: ForeignKeyOption[] };
  modalPosition: { x: number; y: number };
  handleDragStart?: (e: React.MouseEvent<HTMLDivElement>) => void;
  primaryButtonClass: string;
  grayButtonClass: string;
  selectedForeignKeyItem: Item | null;
}

export const SchemaModal: React.FC<SchemaModalProps> = ({
  isOpen,
  setIsOpen,
  tableName,
  fields,
  columnTypes,
  foreignKeys,
  foreignKeyOptions,
  modalPosition,
  handleDragStart: _externalDragStart,
  primaryButtonClass,
  grayButtonClass,
  selectedForeignKeyItem,
}) => {
  const [scale, setScale] = useState(1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mainTablePosition, setMainTablePosition] = useState({ x: 0, y: 0 }); // Position for draggable main table

  useEffect(() => {
    const updateSizeAndPosition = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      if (windowWidth < 1024) {
        setSize({ width: windowWidth, height: windowHeight });
        setPosition({ x: 0, y: 0 });
      } else {
        const initialWidth = windowWidth * 0.95;
        const initialHeight = windowHeight * 0.95;
        setSize({ width: initialWidth, height: initialHeight });
        setPosition({
          x: (windowWidth - initialWidth) / 2,
          y: (windowHeight - initialHeight) / 2,
        });
      }
    };

    updateSizeAndPosition();
    window.addEventListener("resize", updateSizeAndPosition);
    return () => window.removeEventListener("resize", updateSizeAndPosition);
  }, []);

  if (!isOpen) return null;

  const handleScaleChange = (delta: number) => {
    setScale((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleModalDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleDrag = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - startX));
      const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - startY));
      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    };

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleMainTableDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX - mainTablePosition.x;
    const startY = e.clientY - mainTablePosition.y;

    const handleDrag = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(size.width - 200, e.clientX - startX)); // 200px as min width assumption
      const newY = Math.max(0, Math.min(size.height - 100, e.clientY - startY)); // 100px as min height assumption
      setMainTablePosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    };

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startXPos = position.x;
    const startYPos = position.y;

    const handleResize = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;

      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight;

      if (direction.includes("right")) {
        newWidth = Math.min(maxWidth - startXPos, startWidth + deltaX);
      }
      if (direction.includes("left")) {
        newWidth = Math.min(maxWidth + startXPos, startWidth - deltaX);
        newX = Math.max(0, startXPos + deltaX);
      }
      if (direction.includes("bottom")) {
        newHeight = Math.min(maxHeight - startYPos, startHeight + deltaY);
      }
      if (direction.includes("top")) {
        newHeight = Math.min(maxHeight + startYPos, startHeight - deltaY);
        newY = Math.max(0, startYPos + deltaY);
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleResizeEnd = () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", handleResizeEnd);
    };

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const selectedField = selectedForeignKeyItem?.field || "";
  const foreignKeyFields = selectedField
    ? [selectedField]
    : Object.keys(foreignKeys).filter((field) => fields.includes(field));

  return (
    <div className="fixed inset-0 z-51 flex items-center justify-center">
      <div
        className="bg-white sm:rounded-lg shadow-lg flex flex-col border border-gray-200 overflow-hidden relative"
        style={{
          position: "absolute",
          top: position.y,
          left: position.x,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      >
        {/* Fixed Header */}
        <div
          className="flex justify-between items-center p-2 bg-white sticky top-0 z-10 border-b border-gray-200"
          onMouseDown={handleModalDragStart}
        >
          <div className="flex-1 text-center">
            <h2 className="text-sm font-semibold text-gray-800">
              Schema: <span className="text-gray-400 uppercase">{tableName}</span>
              {selectedField && <span className="text-gray-500"> - {selectedField}</span>}
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-600 hover:text-gray-800 text-lg font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content Wrapper */}
        <div className="relative flex-1 overflow-auto">
          <div
            className="p-6 pt-0"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: `${100 / scale}%`,
              height: `${100 / scale}%`,
            }}
          >
            {/* Foreign Key Options */}
            <div className="mb-4">
              {foreignKeyFields.map((field) => {
                const options = foreignKeyOptions[field] || [];
                const relatedTable = foreignKeys[field]?.relatedTable || field.replace("_id", "");
                const relatedColumn = foreignKeys[field]?.relatedColumn || "id";
                const currentValue = selectedForeignKeyItem?.[field]?.toString() || "None";

                return (
                  <div key={field} className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {relatedTable} (via {field})
                    </h3>
                    {selectedForeignKeyItem && (
                      <p className="text-xs text-gray-600 mb-2">
                        Current Value: <span className="font-medium">{currentValue}</span>
                      </p>
                    )}
                    {options.length > 0 && (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-600">
                              {relatedColumn}
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-600">
                              Name
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {options.map((option) => (
                            <tr key={option.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-2 py-1 text-xs text-gray-800">
                                {option.id}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-xs text-gray-800">
                                {option.name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Draggable Main Table Schema */}
            <div
              className="absolute bg-white border border-gray-300 rounded shadow-md cursor-move"
              style={{
                top: mainTablePosition.y,
                left: mainTablePosition.x,
                zIndex: 10,
              }}
              onMouseDown={handleMainTableDragStart}
            >
              <table className="border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border uppercase border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-600">
                      {tableName}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1 text-xs text-gray-800">
                        <div>
                          <div>{field}</div>
                          <div className="text-[10px] text-gray-500">
                            {columnTypes[field] || "unknown"}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Foreign Key Connections */}
            {Object.keys(foreignKeys).length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Foreign Key Connections</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-600">
                        Column
                      </th>
                      <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-600">
                        References
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(foreignKeys).map(([column, { relatedTable, relatedColumn }]) => (
                      <tr key={column} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1 text-xs text-gray-800">
                          {column}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-gray-800">
                          {relatedTable}.{relatedColumn}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Scaling Controls */}
        <div className="absolute bottom-2 right-2 flex space-x-2 z-20">
          <button
            onClick={() => handleScaleChange(-0.1)}
            className="text-xs text-gray-600 hover:text-gray-800 w-6 h-6 flex items-center justify-center border border-gray-300 rounded bg-white"
            aria-label="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => handleScaleChange(0.1)}
            className="text-xs text-gray-600 hover:text-gray-800 w-6 h-6 flex items-center justify-center border border-gray-300 rounded bg-white"
            aria-label="Zoom In"
          >
            +
          </button>
        </div>

        {/* Resize Handles */}
        <div
          className="absolute top-0 right-0 w-2 h-2 bg-gray-400 cursor-nw-resize"
          onMouseDown={(e) => handleResizeStart(e, "top right")}
        />
        <div
          className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 cursor-se-resize"
          onMouseDown={(e) => handleResizeStart(e, "bottom right")}
        />
        <div
          className="absolute bottom-0 left-0 w-2 h-2 bg-gray-400 cursor-sw-resize"
          onMouseDown={(e) => handleResizeStart(e, "bottom left")}
        />
        <div
          className="absolute top-0 left-0 w-2 h-2 bg-gray-400 cursor-nw-resize"
          onMouseDown={(e) => handleResizeStart(e, "top left")}
        />
        <div
          className="absolute top-0 right-0 h-full w-1 bg-gray-400 cursor-e-resize"
          onMouseDown={(e) => handleResizeStart(e, "right")}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-1 bg-gray-400 cursor-s-resize"
          onMouseDown={(e) => handleResizeStart(e, "bottom")}
        />
        <div
          className="absolute top-0 left-0 h-full w-1 bg-gray-400 cursor-w-resize"
          onMouseDown={(e) => handleResizeStart(e, "left")}
        />
        <div
          className="absolute top-0 left-0 w-full h-1 bg-gray-400 cursor-n-resize"
          onMouseDown={(e) => handleResizeStart(e, "top")}
        />
      </div>
    </div>
  );
};