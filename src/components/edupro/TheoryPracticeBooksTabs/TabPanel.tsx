// components/TabPanel.tsx
import { ReactNode } from 'react';

interface TabPanelProps {
  id: string;
  labelledBy: string;
  isActive: boolean;
  children: ReactNode;
}

export default function TabPanel({ id, labelledBy, isActive, children }: TabPanelProps) {
  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={!isActive}
    >
      {children}
    </div>
  );
}