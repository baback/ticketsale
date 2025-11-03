-- Add column to store the PDF URL for tickets
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_pdf_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_ticket_pdf_url ON orders(ticket_pdf_url) WHERE ticket_pdf_url IS NOT NULL;
