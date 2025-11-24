// src/app/forms/[id]/page.tsx
import { FormRenderer } from "@/components/tally/FormRenderer";
import { createSupabaseAIServerClient } from "@/lib/supabaseAI";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";

export const revalidate = 0; // always fresh

export default async function PublicFormPage({ params }: { params: { id: string } }) {
  const tenant = await getCurrentTenant();
  const supabase = await createSupabaseAIServerClient();

  // You will create these tables later — this is future-proof
  const { data: form, error } = await supabase
    .from("forms")
    .select(`
      id,
      title,
      settings,
      organization_id,
      questions (
        id,
        type,
        label,
        required,
        options,
        logic_show_if,
        logic_value
      )
    `)
    .eq("id", params.id)
    .eq("published", true)
    .single();

  if (error || !form) notFound();

  // Enforce tenant isolation
  if (tenant && form.organization_id !== tenant.organizationId) notFound();
  if (!tenant && form.organization_id) notFound(); // optionally allow global forms

  // Load tenant settings for theming
  const settingsResult = await supabase
    .from("settings")
    .select("primary_color, secondary_color, font_family")
    .eq("organization_id", form.organization_id)
    .single();
  
  const orgSettings = settingsResult.data;

  return (
    <FormRenderer
      form={form}
      settings={orgSettings || { primary_color: "purple", font_family: "inter" }}
    />
  );
}