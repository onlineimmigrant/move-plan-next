-- Migration: Create pricingplan_comparison table
-- Created: 2025-08-12

CREATE TABLE IF NOT EXISTS pricingplan_comparison (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    name_translation JSONB DEFAULT '{}',
    description_translation JSONB DEFAULT '{}',
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    CREATED_INDEX idx_pricingplan_comparison_organization ON pricingplan_comparison(organization_id),
    CREATED_INDEX idx_pricingplan_comparison_created_at ON pricingplan_comparison(created_at)
);

-- Add comments for documentation
COMMENT ON TABLE pricingplan_comparison IS 'Stores pricing plan comparison configurations with multilingual support';
COMMENT ON COLUMN pricingplan_comparison.id IS 'Primary key';
COMMENT ON COLUMN pricingplan_comparison.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN pricingplan_comparison.name IS 'Default name of the pricing comparison';
COMMENT ON COLUMN pricingplan_comparison.description IS 'Default description of the pricing comparison';
COMMENT ON COLUMN pricingplan_comparison.name_translation IS 'JSON object containing translations for name in different languages';
COMMENT ON COLUMN pricingplan_comparison.description_translation IS 'JSON object containing translations for description in different languages';
COMMENT ON COLUMN pricingplan_comparison.organization_id IS 'Foreign key reference to organizations table';

-- Insert sample data
INSERT INTO pricingplan_comparison (name, description, name_translation, description_translation, organization_id) VALUES 
(
    'Choose the plan that''s right for you.',
    'Cancel or change plans anytime. No hidden fees, no surprises.',
    '{
        "es": "Elige el plan que sea adecuado para ti.",
        "fr": "Choisissez le plan qui vous convient.",
        "de": "Wählen Sie den für Sie passenden Plan.",
        "ru": "Выберите подходящий для вас план.",
        "it": "Scegli il piano giusto per te.",
        "pt": "Escolha o plano certo para você.",
        "pl": "Wybierz plan, który jest dla Ciebie odpowiedni.",
        "zh": "选择适合您的计划。",
        "ja": "あなたに適したプランを選択してください。"
    }',
    '{
        "es": "Cancela o cambia de plan en cualquier momento. Sin tarifas ocultas, sin sorpresas.",
        "fr": "Annulez ou changez de plan à tout moment. Pas de frais cachés, pas de surprises.",
        "de": "Stornieren Sie oder ändern Sie Pläne jederzeit. Keine versteckten Gebühren, keine Überraschungen.",
        "ru": "Отменяйте или изменяйте планы в любое время. Никаких скрытых платежей, никаких сюрпризов.",
        "it": "Annulla o cambia piani in qualsiasi momento. Nessun costo nascosto, nessuna sorpresa.",
        "pt": "Cancele ou mude planos a qualquer momento. Sem taxas ocultas, sem surpresas.",
        "pl": "Anuluj lub zmień plany w dowolnym momencie. Bez ukrytych opłat, bez niespodzianek.",
        "zh": "随时取消或更改计划。没有隐藏费用，没有意外。",
        "ja": "いつでもプランをキャンセルまたは変更できます。隠れた料金や驚きはありません。"
    }',
    1
);
