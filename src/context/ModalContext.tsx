// src/context/ModalContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ModalContextType {
  isPaletteModalOpen: boolean;
  setIsPaletteModalOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        isPaletteModalOpen,
        setIsPaletteModalOpen,
        isMinimized,
        setIsMinimized,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}