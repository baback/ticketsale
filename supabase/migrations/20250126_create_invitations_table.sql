-- Create event_invitations table
CREATE TABLE IF NOT EXISTS event_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'expired')),
  invitation_token UUID UNIQUE DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_invitations_event ON event_invitations(event_id);
CREATE INDEX idx_invitations_token ON event_invitations(invitation_token);
CREATE INDEX idx_invitations_email ON event_invitations(invitee_email);
CREATE INDEX idx_invitations_organizer ON event_invitations(organizer_id);
CREATE INDEX idx_invitations_status ON event_invitations(status);

-- Enable RLS
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organizers can view invitations for their events
CREATE POLICY "Organizers can view their event invitations"
  ON event_invitations FOR SELECT
  USING (
    organizer_id = auth.uid()
  );

-- Organizers can create invitations for their events
CREATE POLICY "Organizers can create invitations"
  ON event_invitations FOR INSERT
  WITH CHECK (
    organizer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_invitations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Organizers can update their invitations
CREATE POLICY "Organizers can update their invitations"
  ON event_invitations FOR UPDATE
  USING (organizer_id = auth.uid());

-- Public can view invitation by token (for RSVP page)
CREATE POLICY "Public can view invitation by token"
  ON event_invitations FOR SELECT
  USING (invitation_token IS NOT NULL);

-- Public can update invitation status (for RSVP)
CREATE POLICY "Public can update invitation status"
  ON event_invitations FOR UPDATE
  USING (invitation_token IS NOT NULL)
  WITH CHECK (
    -- Only allow updating status and responded_at
    status IN ('accepted', 'declined')
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invitations_timestamp
  BEFORE UPDATE ON event_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_invitations_updated_at();

-- Add comment
COMMENT ON TABLE event_invitations IS 'Stores event guest invitations sent by organizers';
