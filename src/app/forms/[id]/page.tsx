// src/app/forms/[id]/page.tsx
import FormRendererClient from "@/components/tally/FormRendererClient";
import { createSupabaseAIServerClient } from "@/lib/supabaseAI";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";

export const revalidate = 0; // always fresh

export default async function PublicFormPage({ params }: { params: { id: string } }) {
  const tenant = await getCurrentTenant();
  const supabase = await createSupabaseAIServerClient();

  // Fetch form data
  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("id, title, settings, organization_id, published")
    .eq("id", params.id)
    .eq("published", true)
    .single();

  if (formError || !form) notFound();

  // Fetch questions from the complete view
  const { data: questions, error: questionsError } = await supabase
    .from("form_questions_complete")
    .select("id, type, label, description, required, options, validation, logic_show_if, logic_value, order_index")
    .eq("form_id", params.id)
    .order("order_index", { ascending: true });

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
  }

  // Combine form and questions
  const formData = {
    ...form,
    questions: questions || []
  };

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
    thankYouTitle: formSettings.thankYouTitle,
    thankYouMessage: formSettings.thankYouMessage,
    thankYouContactMessage: formSettings.thankYouContactMessage,
    thankYouIcon: formSettings.thankYouIcon,
    thankYouButtonText: formSettings.thankYouButtonText,
    thankYouButtonUrl: formSettings.thankYouButtonUrl,
  };

  return (
    <FormRendererClient
      form={formData}
      settings={settings}
    />
  );
}