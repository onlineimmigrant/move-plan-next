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

  // Use form's own settings (which include columnLayout, formPosition, contentColumns)
  const formSettings = form.settings || {};
  const settings = {
    primary_color: formSettings.theme || 'purple',
    font_family: formSettings.font_family || 'inter',
    designStyle: formSettings.designStyle || 'large',
    showCompanyLogo: formSettings.showCompanyLogo || false,
    columnLayout: formSettings.columnLayout || 1,
    formPosition: formSettings.formPosition || 'left',
    contentColumns: formSettings.contentColumns || [],
  };

  return (
    <FormRenderer
      form={form}
      settings={settings}
    />
  );
}