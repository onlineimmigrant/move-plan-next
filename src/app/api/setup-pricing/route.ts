import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    // Sample data to insert
    const sampleData = {
      name: "Choose the plan that's right for you.",
      description: "Cancel or change plans anytime. No hidden fees, no surprises.",
      name_translation: {
        "en": "Choose the plan that's right for you.",
        "es": "Elige el plan que sea adecuado para ti.",
        "fr": "Choisissez le plan qui vous convient.",
        "de": "Wählen Sie den Plan, der zu Ihnen passt.",
        "ru": "Выберите подходящий вам план.",
        "it": "Scegli il piano giusto per te.",
        "pt": "Escolha o plano certo para você.",
        "pl": "Wybierz plan odpowiedni dla Ciebie.",
        "zh": "选择适合您的计划。",
        "ja": "あなたに適したプランを選択してください。"
      },
      description_translation: {
        "en": "Cancel or change plans anytime. No hidden fees, no surprises.",
        "es": "Cancela o cambia de plan en cualquier momento. Sin tarifas ocultas, sin sorpresas.",
        "fr": "Annulez ou changez de plan à tout moment. Pas de frais cachés, pas de surprises.",
        "de": "Kündigen oder ändern Sie Pläne jederzeit. Keine versteckten Gebühren, keine Überraschungen.",
        "ru": "Отменяйте или изменяйте планы в любое время. Без скрытых комиссий и сюрпризов.",
        "it": "Cancella o cambia piani in qualsiasi momento. Nessuna commissione nascosta, nessuna sorpresa.",
        "pt": "Cancele ou altere planos a qualquer momento. Sem taxas ocultas, sem surpresas.",
        "pl": "Anuluj lub zmień plany w dowolnym momencie. Bez ukrytych opłat, bez niespodzianek.",
        "zh": "随时取消或更改计划。没有隐藏费用，没有惊喜。",
        "ja": "いつでもプランをキャンセルまたは変更できます。隠れた料金や驚きはありません。"
      },
      organization_id: "6695b959-45ef-44b4-a68c-9cd0fe0e25a3" // Use the actual organization_id from the system
    };

    const { data, error } = await supabase
      .from('pricingplan_comparison')
      .insert([sampleData])
      .select();

    if (error) {
      console.error('Error inserting data:', error);
      return NextResponse.json(
        { error: 'Failed to insert data', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: data,
      message: 'Sample data inserted successfully' 
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
