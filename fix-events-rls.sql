-- Add RLS policy to allow users to view events they have tickets for
CREATE POLICY "Users can view events they have tickets for" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.event_id = events.id
      AND orders.user_id = auth.uid()
      AND orders.status = 'completed'
    )
  );
