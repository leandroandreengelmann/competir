-- Migration: Create event_assistant_attachments table
-- Description: Store file attachments (images and PDFs) for event assistant responses

-- Create table for attachments
CREATE TABLE IF NOT EXISTS event_assistant_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    kb_term TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf')),
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- max 10MB
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_assistant_attachments_event_id ON event_assistant_attachments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_assistant_attachments_organizer_id ON event_assistant_attachments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_assistant_attachments_kb_term ON event_assistant_attachments(event_id, kb_term);

-- Enable RLS
ALTER TABLE event_assistant_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own event attachments
CREATE POLICY "Users can view their own event attachments"
    ON event_assistant_attachments
    FOR SELECT
    USING (organizer_id = auth.uid());

-- RLS Policy: Users can insert attachments for their own events
CREATE POLICY "Users can insert attachments for their own events"
    ON event_assistant_attachments
    FOR INSERT
    WITH CHECK (
        organizer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_assistant_attachments.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete their own event attachments
CREATE POLICY "Users can delete their own event attachments"
    ON event_assistant_attachments
    FOR DELETE
    USING (organizer_id = auth.uid());

-- Create Storage Bucket (run this in Supabase Dashboard SQL Editor or via Supabase CLI)
-- Note: This is a comment for manual setup
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-attachments', 'event-attachments', false);

-- Storage RLS Policies (run these in Supabase Dashboard)
-- Note: These are comments for manual setup in Supabase Storage Policies UI
-- 1. Allow authenticated users to upload to their own organizer folder
-- 2. Allow authenticated users to read their own files
-- 3. Allow authenticated users to delete their own files
