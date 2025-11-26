-- Create scan_logs table to track all ticket scanning activity
CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    scanner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    message TEXT NOT NULL,
    error_code TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_scan_logs_event_id ON scan_logs(event_id);
CREATE INDEX idx_scan_logs_ticket_id ON scan_logs(ticket_id);
CREATE INDEX idx_scan_logs_scanner_id ON scan_logs(scanner_id);
CREATE INDEX idx_scan_logs_scanned_at ON scan_logs(scanned_at DESC);
CREATE INDEX idx_scan_logs_status ON scan_logs(status);

-- Enable RLS
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Organizers can view scan logs for their events
CREATE POLICY "Organizers can view scan logs for their events"
    ON scan_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = scan_logs.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- Policy: Organizers and team members can insert scan logs for their events
CREATE POLICY "Organizers can insert scan logs for their events"
    ON scan_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = scan_logs.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- Add comment
COMMENT ON TABLE scan_logs IS 'Logs all ticket scanning activity for audit trail and reporting';
