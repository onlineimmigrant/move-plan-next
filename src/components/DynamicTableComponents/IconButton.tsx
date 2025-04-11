import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext"; // Import your settings context

interface IconButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tooltip: string;
  isActive?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, disabled, icon: Icon, tooltip, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { settings } = useSettings(); // Access settings for primary_color

  console.log(`IconButton - Tooltip: ${tooltip}, isActive: ${isActive}, isHovered: ${isHovered}`);

  const buttonClasses = cn(
    "bg-transparent",
    "border-none",
    "sm:p-3 p-1.5",
    "rounded-full",
    "transition-colors duration-200",
    disabled ? "opacity-50 cursor-not-allowed" : "",
    isHovered && !disabled ? "bg-gray-100" : "",
    isActive ? "!bg-gray-100" : ""
  );

  const iconClasses = cn(
    "h-4 w-4",
    isActive && settings?.primary_color?.name
      ? `text-${settings.primary_color.name}` // Use primary_color when active
      : isActive
      ? "text-sky-600" // Fallback when active and no primary_color
      : "text-gray-500" // Default inactive color
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        console.log(`Hover started for ${tooltip}`);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        console.log(`Hover ended for ${tooltip}`);
      }}
    >
      <button onClick={onClick} disabled={disabled} className={buttonClasses}>
        <Icon className={iconClasses} />
      </button>
      {isHovered && (
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2 top-11",
            "bg-white border border-gray-300 text-gray-700 text-[10px] font-medium",
            "px-1 py-0.5 rounded z-50",
            "w-max min-w-[40px] text-center"
          )}
        >
          {tooltip}
        </span>
      )}
    </div>
  );
};

export default IconButton;