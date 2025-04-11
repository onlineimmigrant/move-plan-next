// src/admin/components/ColorsModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { XMarkIcon, MinusIcon, ArrowsPointingInIcon } from "@heroicons/react/24/outline";
import { tailwindColors, shades } from "@/lib/colorsPalette";

interface ColorsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
}

export default function ColorsModal({ isOpen, setIsOpen, setIsMinimized }: ColorsModalProps) {
  const { settings, setSettings } = useSettings();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 1024, height: 600 }); // Default size for SSR
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Set the size based on device type after mounting
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    setSize(
      isMobile
        ? { width: "95vw", height: "95vh" } // 95% of viewport width and height on mobile
        : { width: 1024, height: 600 } // Default size for desktop
    );
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleColorSelect = (color: string, shade: string) => {
    setSettings((prev) => ({
      ...prev,
      primary_color: { name: `${color.toLowerCase()}-${shade}` },
      secondary_color: { name: `${color.toLowerCase()}-${shade}` },
    }));
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const minimizeModal = () => {
    setIsMinimized(true);
  };

  const resetSize = () => {
    const isMobile = window.innerWidth <= 768;
    setSize(
      isMobile
        ? { width: "95vw", height: "95vh" }
        : { width: 1024, height: 600 }
    );
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMoveDrag = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUpDrag = () => {
    setIsDragging(false);
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMoveResize = (e: MouseEvent) => {
    if (isResizing) {
      const isMobile = window.innerWidth <= 768;
      const newWidth = size.width + (e.clientX - dragStart.x);
      const newHeight = size.height + (e.clientY - dragStart.y);

      // Convert "95vw" and "95vh" to pixels for calculation if necessary
      const currentWidth =
        typeof size.width === "string" && size.width.includes("vw")
          ? (window.innerWidth * 95) / 100
          : size.width;
      const currentHeight =
        typeof size.height === "string" && size.height.includes("vh")
          ? (window.innerHeight * 95) / 100
          : size.height;

      const updatedWidth = currentWidth + (e.clientX - dragStart.x);
      const updatedHeight = currentHeight + (e.clientY - dragStart.y);

      setSize({
        width: isMobile ? `${Math.max(50, updatedWidth)}px` : Math.max(50, newWidth),
        height: isMobile ? `${Math.max(50, updatedHeight)}px` : Math.max(50, newHeight),
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUpResize = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", isDragging ? handleMouseMoveDrag : handleMouseMoveResize);
      window.addEventListener("mouseup", isDragging ? handleMouseUpDrag : handleMouseUpResize);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveDrag);
      window.removeEventListener("mousemove", handleMouseMoveResize);
      window.removeEventListener("mouseup", handleMouseUpDrag);
      window.removeEventListener("mouseup", handleMouseUpResize);
    };
  }, [isDragging, isResizing, dragStart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={modalRef}
        className="bg-white border-2 border-gray-300 rounded-lg shadow-xl absolute pointer-events-auto flex flex-col"
        style={{
          width: typeof size.width === "string" ? size.width : `${size.width}px`,
          height: typeof size.height === "string" ? size.height : `${size.height}px`,
          left: `calc(50% + ${position.x}px)`,
          top: `calc(50% + ${position.y}px)`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Fixed Header */}
        <div
          className="p-3 border-b rounded-t-lg border-gray-200 cursor-move flex justify-between items-center bg-white sticky top-0 z-10"
          onMouseDown={handleMouseDownDrag}
        >
          <h2 className="text-sm font-bold text-gray-800">Color Palette</h2>
          <div className="flex gap-1">
            <button
              onClick={minimizeModal}
              className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              <MinusIcon className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={resetSize}
              className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              <ArrowsPointingInIcon className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={closeModal}
              className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              <XMarkIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto">
            {/* Header Row for Shades */}
            <div className="grid grid-cols-12 gap-1 mb-4 sticky top-0 bg-white pt-2 pb-2 z-10 min-w-[800px]">
              <div className="col-span-1"></div>
              {shades.map((shade) => (
                <div key={shade} className="text-center text-xs font-medium text-gray-500">
                  {shade}
                </div>
              ))}
            </div>

            {/* Color Rows */}
            {Object.entries(tailwindColors).map(([colorName, shadesObj]) => (
              <div key={colorName} className="grid grid-cols-12 gap-1 mb-2 items-center min-w-[800px]">
                <div className="col-span-1 text-xs font-medium text-gray-600">
                  {colorName}
                </div>
                {shades.map((shade) => {
                  const hex = shadesObj[shade];
                  const isSelected =
                    settings?.primary_color?.name === `${colorName.toLowerCase()}-${shade}` || settings?.secondary_color?.name === `${colorName.toLowerCase()}-${shade}`;
                  return (
                    <div key={`${colorName}-${shade}`} className="relative group">
                      <button
                        onClick={() => handleColorSelect(colorName, shade)}
                        className={cn(
                          "h-10 w-10 rounded-sm flex items-center justify-center transition-all",
                          isSelected
                            ? "ring-2 ring-offset-1 ring-gray-600"
                            : "hover:ring-1 hover:ring-offset-1 hover:ring-gray-300"
                        )}
                        style={{ backgroundColor: hex }}
                      />
                      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                        <div className="bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-sm">
                          {hex}
                          {copiedHex === hex && (
                            <span className="ml-2 text-green-400">Copied!</span>
                          )}
                        </div>
                        <div className="w-2 h-2 bg-gray-700 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                      </div>
                      <button
                        onClick={() => handleCopyHex(hex)}
                        className="absolute inset-0 opacity-0"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 sm:w-full rounded-b-md h-4 bg-gray-50 cursor-se-resize"
          onMouseDown={handleMouseDownResize}
        />
      </div>
    </div>
  );
}