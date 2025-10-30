-- Meeting Transcriptions Table
-- Stores real-time transcription and AI analysis for video calls

CREATE TABLE IF NOT EXISTS meeting_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Meeting identification
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- AI Model used (CORRECTED: bigint to match ai_models_system.id)
  ai_model_id BIGINT REFERENCES ai_models_system(id) ON DELETE SET NULL,
  
  -- Transcription data
  transcript JSONB NOT NULL DEFAULT '[]', -- Array of {speaker, text, timestamp, confidence}
  full_text TEXT, -- Full concatenated transcript for search
  
  -- AI Analysis results (multi-task)
  analysis JSONB, -- {tasks: [{taskId, taskName, result, timestamp, tokensUsed}]}
  
  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Usage tracking
  total_tokens_used INTEGER DEFAULT 0,
  transcription_cost DECIMAL(10, 4) DEFAULT 0, -- AssemblyAI cost
  analysis_cost DECIMAL(10, 4) DEFAULT 0, -- AI model cost
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_duration CHECK (duration_seconds >= 0),
  CONSTRAINT valid_tokens CHECK (total_tokens_used >= 0)
);

-- Indexes for performance
CREATE INDEX idx_meeting_transcriptions_booking ON meeting_transcriptions(booking_id);
CREATE INDEX idx_meeting_transcriptions_org ON meeting_transcriptions(organization_id);
CREATE INDEX idx_meeting_transcriptions_model ON meeting_transcriptions(ai_model_id);
CREATE INDEX idx_meeting_transcriptions_created ON meeting_transcriptions(created_at DESC);
CREATE INDEX idx_meeting_transcriptions_full_text ON meeting_transcriptions USING gin(to_tsvector('english', full_text));

-- Row Level Security
ALTER TABLE meeting_transcriptions ENABLE ROW LEVEL SECURITY;

-- Users can view transcriptions for their organization
CREATE POLICY meeting_transcriptions_select_policy ON meeting_transcriptions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can insert transcriptions for their organization
CREATE POLICY meeting_transcriptions_insert_policy ON meeting_transcriptions
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update transcriptions for their organization
CREATE POLICY meeting_transcriptions_update_policy ON meeting_transcriptions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_meeting_transcriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meeting_transcriptions_updated_at
  BEFORE UPDATE ON meeting_transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_transcriptions_updated_at();

-- Comments
COMMENT ON TABLE meeting_transcriptions IS 'Stores real-time meeting transcriptions and AI analysis';
COMMENT ON COLUMN meeting_transcriptions.transcript IS 'JSONB array of transcript segments with speaker, text, timestamp';
COMMENT ON COLUMN meeting_transcriptions.analysis IS 'JSONB object containing multi-task AI analysis results';
COMMENT ON COLUMN meeting_transcriptions.ai_model_id IS 'References ai_models_system.id (bigint) - the AI model used for analysis';
