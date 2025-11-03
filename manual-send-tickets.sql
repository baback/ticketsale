-- Manual ticket email sending script
-- Use this if webhook didn't fire or email wasn't sent

-- First, check your recent orders
SELECT 
  o.id,
  o.status,
  o.created_at,
  e.name as event_name,
  u.email as user_email,
  COUNT(t.id) as ticket_count
FROM orders o
JOIN events e ON e.id = o.event_id
JOIN auth.users u ON u.id = o.user_id
LEFT JOIN tickets t ON t.order_id = o.id
WHERE o.created_at > NOW() - INTERVAL '1 hour'
GROUP BY o.id, o.status, o.created_at, e.name, u.email
ORDER BY o.created_at DESC;

-- If you see an order with status='pending' and no tickets, run this:
-- (Replace 'YOUR_ORDER_ID' with the actual order ID from above)

-- Update order status
-- UPDATE orders SET status = 'completed' WHERE id = 'YOUR_ORDER_ID';

-- Create tickets (this will trigger QR code generation)
-- INSERT INTO tickets (order_id, order_item_id, ticket_type_id, event_id, user_id, status)
-- SELECT 
--   oi.order_id,
--   oi.id,
--   oi.ticket_type_id,
--   o.event_id,
--   o.user_id,
--   'valid'
-- FROM order_items oi
-- JOIN orders o ON o.id = oi.order_id
-- CROSS JOIN generate_series(1, oi.quantity)
-- WHERE oi.order_id = 'YOUR_ORDER_ID';

-- Then manually trigger the webhook by going to Stripe Dashboard:
-- 1. Go to Stripe Dashboard → Webhooks
-- 2. Find your webhook endpoint
-- 3. Click "Send test webhook"
-- 4. Select "checkout.session.completed"
-- 5. Or resend the actual event from the Events tab
