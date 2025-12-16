// admin/[table]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DynamicTable from "@/components/DynamicTableComponents/DynamicTable";
import { getTableToDisclosure } from "@/lib/sidebarLinks";
import { useSettings } from "@/context/SettingsContext";
import { useParams } from "next/navigation";
import ColorsModal from "@/components/ColorsModal";
import { useModal } from "@/context/ModalContext";
import { supabase } from '@/lib/supabaseClient';

// Mapping of URL table names to actual Supabase table names
const tableNameMapping: { [key: string]: string } = {
  products: "product",
  pricingplans: "pricingplan",
  product_types: "product_type",
  product_sub_types: "product_sub_type",
  features: "feature",
  faq: "faq",
  countries: "countries",
  currencies: "currency",
  todo: "todo",
  item_types: "item_types",
  settings: "settings",
};

export default function TablePage() {
  const router = useRouter();
  const params = useParams();
  const { settings } = useSettings();
  const { isPaletteModalOpen, setIsPaletteModalOpen, isMinimized, setIsMinimized } = useModal();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const urlTableName = params.table as string;

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        router.push("/");
        return;
      }

      // Allow both admin and superadmin roles
      if (profile.role !== "admin" && profile.role !== "superadmin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // or some fallback UI while redirecting
  }

  // Map the URL table name to the actual Supabase table name
  const tableName = tableNameMapping[urlTableName] || urlTableName;

  // Dynamically generate the table-to-disclosure mapping
  const tableToDisclosure = getTableToDisclosure();

  // Determine the disclosure section for the current table
  const disclosureSection = tableToDisclosure[urlTableName] || "unknown";
  const formattedDisclosure = disclosureSection
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleRestoreModal = () => {
    if (setIsMinimized) {
      setIsMinimized(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center">
        <h1 className="text-sm p-6 pt-4 pb-0 capitalize font-bold text-gray-700">
          {formattedDisclosure}
          <span className="text-gray-700">
            {" "}
            {tableName.charAt(0).toUpperCase() + tableName.slice(1)}
          </span>
        </h1>
        <span className="text-sm p-6 pt-4 pb-0 capitalize font-bold text-gray-700">
          Table
        </span>
      </div>

      <DynamicTable tableName={tableName} apiEndpoint={`/admin/${urlTableName}/api`} />

      {/* Render the ColorsModal on any page if it's open */}
      {!isMinimized && (
        <ColorsModal
          isOpen={isPaletteModalOpen}
          setIsOpen={setIsPaletteModalOpen}
          setIsMinimized={setIsMinimized}
        />
      )}

      {/* Minimized Modal Button */}
      {isMinimized && (
        <button
          onClick={handleRestoreModal}
          className="fixed bottom-4 right-4 bg-gray-200 px-2 py-1 rounded-full shadow-lg hover:bg-gray-300 z-50"
        >
          <span className="text-sm font-medium">Palette</span>
        </button>
      )}
    </div>
  );
}