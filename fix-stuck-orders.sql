-- Script to manually complete stuck orders and generate tickets
-- Run this to fix the two pending orders

-- Order 1: c4d9d54a-1c18-4085-b474-314b6a98b676 (2 tickets)
-- Order 2: 3e102a43-2206-4b09-875b-a9eded0be284 (4 tickets)

-- First, let's update the orders to completed status
UPDATE orders 
SET status = 'completed', 
    updated_at = NOW()
WHERE id IN ('c4d9d54a-1c18-4085-b474-314b6a98b676', '3e102a43-2206-4b09-875b-a9eded0be284');

-- Generate tickets for Order 1 (2 tickets)
INSERT INTO tickets (event_id, order_id, ticket_type_id, qr_code, status)
SELECT 
    'c5b06e76-c67e-4f50-b75a-3d51409ba526',
    'c4d9d54a-1c18-4085-b474-314b6a98b676',
    '85534f3f-bafb-45ab-89c9-bdde44a620d1',
    'TICKET-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    'valid'
FROM generate_series(1, 2);

-- Generate tickets for Order 2 (4 tickets)
INSERT INTO tickets (event_id, order_id, ticket_type_id, qr_code, status)
SELECT 
    'c5b06e76-c67e-4f50-b75a-3d51409ba526',
    '3e102a43-2206-4b09-875b-a9eded0be284',
    '85534f3f-bafb-45ab-89c9-bdde44a620d1',
    'TICKET-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
    'valid'
FROM generate_series(1, 4);

-- Verify the tickets were created
SELECT 
    o.id as order_id,
    o.customer_name,
    o.status,
    COUNT(t.id) as ticket_count
FROM orders o
LEFT JOIN tickets t ON o.id = t.order_id
WHERE o.id IN ('c4d9d54a-1c18-4085-b474-314b6a98b676', '3e102a43-2206-4b09-875b-a9eded0be284')
GROUP BY o.id, o.customer_name, o.status;
