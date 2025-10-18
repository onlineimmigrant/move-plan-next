-- Migration: Add internal notes system for admin coordination
-- This allows admins to leave private notes on tickets that customers cannot see
-- Use cases: handoff notes, customer context, action items, internal discussions

-- Create ticket_notes table
CREATE TABLE IF NOT EXISTS public.ticket_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Ensure note_text is not empty
  CONSTRAINT note_text_not_empty CHECK (char_length(trim(note_text)) > 0)
);

-- Create index for fast ticket note lookups
CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket_id ON public.ticket_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notes_created_at ON public.ticket_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_notes_admin_id ON public.ticket_notes(admin_id);

-- Add comment for table documentation
COMMENT ON TABLE public.ticket_notes IS 'Internal notes for tickets - only visible to admins, used for coordination and context';
COMMENT ON COLUMN public.ticket_notes.is_pinned IS 'Pinned notes appear at the top for important information';

-- Enable Row Level Security
ALTER TABLE public.ticket_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view internal notes
CREATE POLICY "Admins can view all internal notes"
  ON public.ticket_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- RLS Policy: Only admins can create internal notes
CREATE POLICY "Admins can create internal notes"
  ON public.ticket_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
    AND admin_id = auth.uid()
  );

-- RLS Policy: Admins can update their own notes (for editing)
CREATE POLICY "Admins can update their own notes"
  ON public.ticket_notes
  FOR UPDATE
  USING (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- RLS Policy: Admins can delete their own notes
CREATE POLICY "Admins can delete their own notes"
  ON public.ticket_notes
  FOR DELETE
  USING (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Enable realtime for ticket_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_notes;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ticket_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on note modifications
CREATE TRIGGER update_ticket_notes_updated_at_trigger
  BEFORE UPDATE ON public.ticket_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_notes_updated_at();
