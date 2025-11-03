-- Add RLS policy to allow users to view events they have purchased tickets for
-- This fixes the issue where users can't see event details in their dashboard

CREATE POLICY "Users can view events they have tickets for" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.event_id = events.id
      AND orders.user_id = auth.uid()
      AND orders.status = 'completed'
    )
  );
