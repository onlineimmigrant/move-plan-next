-- Insert sample pricing comparison data for testing
INSERT INTO pricingplan_comparison (
  name,
  description,
  name_translation,
  description_translation,
  organization_id
) VALUES (
  'Choose the plan that''s right for you.',
  'Cancel or change plans anytime. No hidden fees, no surprises.',
  '{
    "en": "Choose the plan that''s right for you.",
    "es": "Elige el plan que sea adecuado para ti.",
    "fr": "Choisissez le plan qui vous convient.",
    "de": "Wählen Sie den Plan, der zu Ihnen passt.",
    "ru": "Выберите подходящий вам план.",
    "it": "Scegli il piano giusto per te.",
    "pt": "Escolha o plano certo para você.",
    "pl": "Wybierz plan odpowiedni dla Ciebie.",
    "zh": "选择适合您的计划。",
    "ja": "あなたに適したプランを選択してください。"
  }',
  '{
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
  }',
  1
);
