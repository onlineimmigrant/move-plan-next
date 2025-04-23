// src/components/NavbarWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "./Breadcrumbs";

export default function NavbarFooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
   
      {!isAdminRoute && <Header  />}
      
      {children}
      {/**/}
      {!isAdminRoute && <Footer />}
    
    </>
  );
}