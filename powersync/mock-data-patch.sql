-- =============================================================================
-- Patch: Fill Payable Amount & Receivable Amount on Dashboard
-- =============================================================================
-- Payable Amount = SUM(abs(purchase_invoices.invoice_balance))
--   WHERE purchase_orders.status IN (4=PARTIALLY_RECEIVED, 5=RECEIVED, 6=CLOSED)
--   AND date(purchase_invoices.created_at) within date range
--
-- Receivable Amount = SUM(invoices.remaining_amount)
--   WHERE invoices.status != 3 (PAID)
--   AND date(invoices.created_at) within date range
-- =============================================================================

BEGIN;

-- Cleanup
DELETE FROM purchase_invoices WHERE no LIKE 'MOCK-PINV-%';
DELETE FROM invoices WHERE no LIKE 'MOCK-RINV-%';

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PURCHASE INVOICES (for Payable Amount)
--    Linked to our purchase orders that have status 4/5/6
--    invoice_balance = amount still owed to supplier
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO purchase_invoices (
  no, purchase_order_id, supplier_id, invoice_balance,
  sub_total, total_amount, total_discount, status,
  created_at
)
SELECT
  'MOCK-PINV-' || LPAD(ROW_NUMBER() OVER (ORDER BY po.no)::text, 4, '0'),
  po.id,
  po.supplier_id,
  v.invoice_balance,
  v.sub_total,
  v.total_amount,
  0,
  v.inv_status,
  v.created_at::timestamp
FROM (VALUES
  -- PO-0003 (PARTIALLY_RECEIVED, $2800): partially paid, still owe $1800
  ('MOCK-PO-0003', 1800.00, 2800.00, 2800.00, 1, '2026-02-05 10:30:00'),
  -- PO-0004 (RECEIVED, $8200): just received, full balance outstanding
  ('MOCK-PO-0004', 8200.00, 8200.00, 8200.00, 1, '2026-02-05 09:00:00'),
  -- PO-0005 (CLOSED, $4500): partially paid, $1200 remaining
  ('MOCK-PO-0005', 1200.00, 4500.00, 4500.00, 5, '2026-02-05 07:30:00'),
  -- PO-0007 (RECEIVED, $5200): full balance outstanding
  ('MOCK-PO-0007', 5200.00, 5200.00, 5200.00, 1, '2026-02-05 00:00:00'),
  -- PO-0008 (PARTIALLY_RECEIVED, $6800): $3400 paid, $3400 remaining
  ('MOCK-PO-0008', 3400.00, 6800.00, 6800.00, 5, '2026-02-05 00:00:00')
) AS v(po_no, invoice_balance, sub_total, total_amount, inv_status, created_at)
JOIN purchase_orders po ON po.no = v.po_no;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. UNPAID/PARTIALLY PAID INVOICES (for Receivable Amount)
--    These are sale invoices where remaining_amount > 0
--    InvoiceStatus: DUE=1, UN_PAID=2, PARTIALLY_PAID=5
-- ─────────────────────────────────────────────────────────────────────────────

-- Create invoices for today's Executed orders (not yet fully paid)
INSERT INTO invoices (
  sale_order_id, customer_id, no, status,
  sub_total, total_amount, total_discount, remaining_amount,
  created_at
)
SELECT
  so.id, so.customer_id,
  'MOCK-RINV-' || LPAD(ROW_NUMBER() OVER (ORDER BY so.no)::text, 4, '0'),
  v.inv_status,
  so.sub_total, so.total_price, COALESCE(so.total_discount, 0), v.remaining,
  so.order_date
FROM (VALUES
  -- XSO-0008: Executed, MacBook $2749.89 - customer paid $1500, owes $1249.89
  ('MOCK-XSO-0008', 5, 1249.89),
  -- XSO-0009: Executed, $549.89 - unpaid
  ('MOCK-XSO-0009', 2, 549.89),
  -- XSO-0012: (original MOCK) Executed Samsung $989.99 - partially paid, owes $489.99
  ('MOCK-SO-0012', 5, 489.99),
  -- XSO-0013: Pending, Jacket $274.89 - due
  ('MOCK-XSO-0013', 1, 274.89),
  -- XSO-0015: Pending, Samsung $989.89 - due
  ('MOCK-XSO-0015', 1, 989.89)
) AS v(so_no, inv_status, remaining)
JOIN sale_orders so ON so.no = v.so_no;

COMMIT;

-- Verify
-- SELECT 'payable' as metric, ROUND(abs(SUM(pi.invoice_balance))::numeric, 2) as amount
-- FROM purchase_invoices pi
-- JOIN purchase_orders po ON po.id = pi.purchase_order_id
-- WHERE po.status IN (4,5,6)
-- AND date(pi.created_at) = '2026-02-05'
-- UNION ALL
-- SELECT 'receivable', ROUND(SUM(remaining_amount)::numeric, 2)
-- FROM invoices
-- WHERE status != 3
-- AND date(created_at) = '2026-02-05';
