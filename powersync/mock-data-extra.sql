-- =============================================================================
-- KHUB Retail POS - Extra Mock Data (Dashboard Fill)
-- =============================================================================
-- Adds today's date orders, purchase orders, and return orders
-- so the kweb dashboard shows meaningful data with the default date filter.
-- =============================================================================
-- Key constants:
--   SaleOrderStatus: PENDING=10, IN_PROGRESS=20, PICKED=23, PACKED=30,
--                    EXECUTED=40, COMPLETED=50, PARKED=70, VOID=90
--   PurchaseOrderStatus: IN_PROGRESS=2, PARTIALLY_RECEIVED=4, RECEIVED=5, CLOSED=6
--   SaleType: ORDER=1, RETURN=2
--   OrderType: WALK_IN=1, PHONE=2, ONLINE=3
--   PaymentType: CASH=1, CREDIT_DEBIT_TERMINAL=13
--   FulfilmentStatus: NOT_FULFILLED=1, COMPLETELY_FULFILLED=3
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- CLEANUP extra mock data (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM ledgers WHERE note LIKE 'Mock extra%';
DELETE FROM payments WHERE no LIKE 'MOCK-XPAY-%';
DELETE FROM invoices WHERE no LIKE 'MOCK-XINV-%';
DELETE FROM sale_order_details WHERE sale_order_id IN (SELECT id FROM sale_orders WHERE no LIKE 'MOCK-XSO-%');
DELETE FROM sale_orders WHERE no LIKE 'MOCK-XSO-%';
DELETE FROM purchase_order_details WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE no LIKE 'MOCK-PO-%');
DELETE FROM purchase_orders WHERE no LIKE 'MOCK-PO-%';

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TODAY'S SALE ORDERS (various statuses for dashboard breakdown)
--    Using today = 2026-02-05 (the date shown on the dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO sale_orders (no, customer_id, order_type, sale_type, status, is_picked, is_packed, fulfilment_status, shipping_type, cash_n_carry, total_price, sub_total, tax, tax_type, discount, discount_type, total_discount, order_date, channel_id, created_by_id, customer_name, number_of_items, total_qty)
SELECT v.no, c.id, v.order_type, v.sale_type, v.status, v.is_picked, v.is_packed, v.fulfilment_status, v.shipping_type, v.cash_n_carry, v.total_price, v.sub_total, v.tax, v.tax_type, v.discount, v.discount_type, v.total_discount, v.order_date::timestamp, v.channel_id, 1, v.customer_name, v.number_of_items, v.total_qty
FROM (VALUES
  -- COMPLETED orders today (status=50) - biggest chunk
  ('MOCK-XSO-0001','MOCK0001',1,1,50,true,true,3,1,'Y',  1249.88, 1136.25, 113.63, 1, 0.00, 2, 0.00,'2026-02-05 09:15:00',1,'John Smith',3,5),
  ('MOCK-XSO-0002','MOCK0003',1,1,50,true,true,3,1,'Y',  4598.89, 4180.81, 418.08, 1, 0.00, 2, 0.00,'2026-02-05 09:45:00',1,'Michael Chen',2,2),
  ('MOCK-XSO-0003','MOCK0005',3,1,50,true,true,3,2,'N',   384.89,  349.90, 34.99, 1, 0.00, 2, 0.00,'2026-02-05 10:20:00',1,'David Wilson',2,3),
  ('MOCK-XSO-0004','MOCK0008',1,1,50,true,true,3,1,'Y',    43.89,   39.90, 3.99, 1, 0.00, 2, 0.00,'2026-02-05 10:55:00',1,'Jennifer Brown',3,8),
  ('MOCK-XSO-0005','MOCK0014',2,1,50,true,true,3,1,'Y',  1759.88, 1599.89, 159.99, 1, 0.00, 2, 0.00,'2026-02-05 11:30:00',1,'Michelle Clark',2,2),
  ('MOCK-XSO-0006','MOCK0002',1,1,50,true,true,3,1,'Y',   164.87,  149.88, 14.99, 1, 0.00, 2, 0.00,'2026-02-05 12:00:00',1,'Sarah Johnson',2,4),
  ('MOCK-XSO-0007','MOCK0010',1,1,50,true,true,3,1,'Y',    87.89,   79.90, 7.99, 1, 0.00, 2, 0.00,'2026-02-05 13:15:00',1,'Amanda Garcia',1,1),
  -- EXECUTED orders today (status=40)
  ('MOCK-XSO-0008','MOCK0007',1,1,40,true,true,1,1,'Y',  2749.89, 2499.90, 249.99, 1, 0.00, 2, 0.00,'2026-02-05 08:30:00',1,'Robert Taylor',1,1),
  ('MOCK-XSO-0009','MOCK0011',2,1,40,true,true,1,1,'N',   549.89,  499.90, 49.99, 1, 0.00, 2, 0.00,'2026-02-05 11:00:00',1,'Thomas Anderson',2,3),
  -- PACKED orders (status=30)
  ('MOCK-XSO-0010','MOCK0016',1,1,30,true,true,1,1,'Y',   329.89,  299.90, 29.99, 1, 0.00, 2, 0.00,'2026-02-05 13:30:00',1,'Patricia Lewis',2,2),
  -- PICKED orders (status=23)
  ('MOCK-XSO-0011','MOCK0017',1,1,23,true,false,1,1,'Y',  139.88,  127.16, 12.72, 1, 0.00, 2, 0.00,'2026-02-05 14:00:00',1,'Kevin Robinson',3,6),
  -- IN_PROGRESS (status=20)
  ('MOCK-XSO-0012','MOCK0009',1,1,20,false,false,1,1,'Y', 499.89,  454.45, 45.44, 1, 0.00, 2, 0.00,'2026-02-05 14:30:00',1,'William Lee',1,1),
  -- PENDING orders (status=10)
  ('MOCK-XSO-0013','MOCK0004',3,1,10,false,false,1,2,'N',  274.89,  249.90, 24.99, 1, 0.00, 2, 0.00,'2026-02-05 14:45:00',1,'Emily Davis',1,1),
  ('MOCK-XSO-0014','MOCK0006',1,1,10,false,false,1,1,'Y',   54.87,   49.88, 4.99, 1, 0.00, 2, 0.00,'2026-02-05 15:00:00',1,'Lisa Martinez',2,6),
  ('MOCK-XSO-0015','MOCK0020',3,1,10,false,false,1,2,'N',  989.89,  899.90, 89.99, 1, 0.00, 2, 0.00,'2026-02-05 15:15:00',1,'Karen Young',1,1),
  -- PARKED order (status=70)
  ('MOCK-XSO-0016','MOCK0019',1,1,70,false,false,1,1,'Y',  219.87,  199.88, 19.99, 1, 0.00, 2, 0.00,'2026-02-05 12:45:00',1,'Mark Hall',2,3),
  -- RETURN orders today (sale_type=2, status=50 COMPLETED)
  ('MOCK-XSO-0017','MOCK0001',1,2,50,true,true,3,1,'Y',   -249.99, -227.27,-22.72, 1, 0.00, 2, 0.00,'2026-02-05 11:15:00',1,'John Smith',1,1),
  ('MOCK-XSO-0018','MOCK0010',1,2,50,true,true,3,1,'Y',    -69.99,  -63.63, -6.36, 1, 0.00, 2, 0.00,'2026-02-05 14:15:00',1,'Amanda Garcia',1,1)
) AS v(no, cust_no, order_type, sale_type, status, is_picked, is_packed, fulfilment_status, shipping_type, cash_n_carry, total_price, sub_total, tax, tax_type, discount, discount_type, total_discount, order_date, channel_id, customer_name, number_of_items, total_qty)
JOIN customers c ON c.no = v.cust_no;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TODAY'S SALE ORDER DETAILS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO sale_order_details (
  sale_order_id, product_id, qty, order_qty, picked_qty, packed_qty, delivered_qty, return_qty,
  unit_price, unit_cost, unit, lowest_unit_definition, default_qty,
  discount_type, discount, scannables, unit_price_data, unit_price_id,
  product_name, product_images, is_custom_price
)
SELECT
  so.id, p.id, v.qty, v.qty,
  CASE WHEN so.status IN (23,30,40,50) THEN v.qty ELSE 0 END,
  CASE WHEN so.status IN (30,40,50) THEN v.qty ELSE 0 END,
  CASE WHEN so.status = 50 THEN v.qty ELSE 0 END,
  CASE WHEN so.sale_type = 2 THEN v.qty ELSE 0 END,
  up.price, up.cost, 1, 1, 1,
  2, 0, '{}', '{}', up.id,
  v.pname, '[]', false
FROM (VALUES
  -- XSO-0001: iPhone + AirPods x2 + Yoga Mat x2
  ('MOCK-XSO-0001','MOCK00000001',1,'iPhone 15 Pro Max'),
  ('MOCK-XSO-0001','MOCK00000006',2,'AirPods Pro 2'),
  ('MOCK-XSO-0001','MOCK00000017',2,'Premium Yoga Mat 6mm'),
  -- XSO-0002: MacBook + Dell XPS
  ('MOCK-XSO-0002','MOCK00000003',1,'MacBook Pro 16" M3 Max'),
  ('MOCK-XSO-0002','MOCK00000004',1,'Dell XPS 15'),
  -- XSO-0003: Sony Headphones + Dumbbells x2
  ('MOCK-XSO-0003','MOCK00000005',1,'Sony WH-1000XM5'),
  ('MOCK-XSO-0003','MOCK00000018',2,'Adjustable Dumbbell Set'),
  -- XSO-0004: Chips x3 + Chocolate x2 + Water x3
  ('MOCK-XSO-0004','MOCK00000011',3,'Organic Potato Chips'),
  ('MOCK-XSO-0004','MOCK00000012',2,'Dark Chocolate Bar 72%'),
  ('MOCK-XSO-0004','MOCK00000014',3,'Sparkling Mineral Water'),
  -- XSO-0005: Samsung + Samsung (2 units)
  ('MOCK-XSO-0005','MOCK00000002',1,'Samsung Galaxy S24 Ultra'),
  ('MOCK-XSO-0005','MOCK00000001',1,'iPhone 15 Pro Max'),
  -- XSO-0006: T-Shirt x2 + Jeans x2
  ('MOCK-XSO-0006','MOCK00000007',2,'Classic Cotton T-Shirt'),
  ('MOCK-XSO-0006','MOCK00000008',2,'Slim Fit Denim Jeans'),
  -- XSO-0007: Coffee Maker
  ('MOCK-XSO-0007','MOCK00000015',1,'Programmable Coffee Maker'),
  -- XSO-0008: MacBook
  ('MOCK-XSO-0008','MOCK00000003',1,'MacBook Pro 16" M3 Max'),
  -- XSO-0009: Robot Vacuum + Coffee Maker + Energy Drinks
  ('MOCK-XSO-0009','MOCK00000016',1,'Robot Vacuum Cleaner'),
  ('MOCK-XSO-0009','MOCK00000015',1,'Programmable Coffee Maker'),
  ('MOCK-XSO-0009','MOCK00000013',1,'Energy Boost Drink'),
  -- XSO-0010: Jacket + Dress
  ('MOCK-XSO-0010','MOCK00000010',1,'Leather Bomber Jacket'),
  ('MOCK-XSO-0010','MOCK00000009',1,'Floral Summer Dress'),
  -- XSO-0011: T-Shirt x2 + Chips x2 + Energy Drink x2
  ('MOCK-XSO-0011','MOCK00000007',2,'Classic Cotton T-Shirt'),
  ('MOCK-XSO-0011','MOCK00000011',2,'Organic Potato Chips'),
  ('MOCK-XSO-0011','MOCK00000013',2,'Energy Boost Drink'),
  -- XSO-0012: Robot Vacuum
  ('MOCK-XSO-0012','MOCK00000016',1,'Robot Vacuum Cleaner'),
  -- XSO-0013: Leather Jacket
  ('MOCK-XSO-0013','MOCK00000010',1,'Leather Bomber Jacket'),
  -- XSO-0014: Chips x3 + Energy Drink x3
  ('MOCK-XSO-0014','MOCK00000011',3,'Organic Potato Chips'),
  ('MOCK-XSO-0014','MOCK00000013',3,'Energy Boost Drink'),
  -- XSO-0015: Samsung Galaxy
  ('MOCK-XSO-0015','MOCK00000002',1,'Samsung Galaxy S24 Ultra'),
  -- XSO-0016: Jeans + Yoga Mat + Chocolate
  ('MOCK-XSO-0016','MOCK00000008',1,'Slim Fit Denim Jeans'),
  ('MOCK-XSO-0016','MOCK00000017',1,'Premium Yoga Mat 6mm'),
  ('MOCK-XSO-0016','MOCK00000012',1,'Dark Chocolate Bar 72%'),
  -- XSO-0017: RETURN - Leather Jacket
  ('MOCK-XSO-0017','MOCK00000010',1,'Leather Bomber Jacket'),
  -- XSO-0018: RETURN - Floral Dress
  ('MOCK-XSO-0018','MOCK00000009',1,'Floral Summer Dress')
) AS v(sono, sku, qty, pname)
JOIN sale_orders so ON so.no = v.sono
JOIN products p ON p.sku = v.sku
JOIN unit_prices up ON up.product_id = p.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INVOICES for today's completed orders
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO invoices (sale_order_id, customer_id, no, status, sub_total, total_amount, total_discount, remaining_amount)
SELECT so.id, so.customer_id,
  'MOCK-XINV-' || LPAD(ROW_NUMBER() OVER (ORDER BY so.no)::text, 4, '0'),
  3, -- PAID
  so.sub_total, so.total_price, COALESCE(so.total_discount, 0), 0
FROM sale_orders so
WHERE so.no LIKE 'MOCK-XSO-%' AND so.status = 50 AND so.sale_type = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PAYMENTS for today's completed orders (parent + child pattern)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  rec RECORD;
  parent_pay_id INT;
  cnt INT := 0;
  pay_types INT[] := ARRAY[1, 13, 1, 1, 13, 1, 1]; -- mix of CASH and CREDIT_DEBIT_TERMINAL
BEGIN
  FOR rec IN
    SELECT inv.id as inv_id, inv.customer_id, inv.total_amount, inv.no as inv_no,
           so.order_date, so.no as so_no
    FROM invoices inv
    JOIN sale_orders so ON so.id = inv.sale_order_id
    WHERE inv.no LIKE 'MOCK-XINV-%'
    ORDER BY inv.no
  LOOP
    cnt := cnt + 1;
    -- Parent payment
    INSERT INTO payments (no, invoice_id, customer_id, status, payment_type, payment_date, schedule_date, amount, remaining_amount, category, memo, external_details, source, performed_by, performer_id)
    VALUES ('MOCK-XPAY-' || LPAD(cnt::text, 4, '0'), NULL, rec.customer_id, 2, pay_types[((cnt-1) % 7) + 1], rec.order_date, rec.order_date, rec.total_amount, 0, 1, 'Payment for ' || rec.so_no, '{}', 1, 1, 1)
    RETURNING id INTO parent_pay_id;
    -- Child payment
    INSERT INTO payments (no, invoice_id, customer_id, parent_id, status, payment_type, payment_date, schedule_date, amount, remaining_amount, category, memo, external_details, source, performed_by, performer_id)
    VALUES ('MOCK-XPAY-' || LPAD(cnt::text, 4, '0') || 'C', rec.inv_id, rec.customer_id, parent_pay_id, 2, pay_types[((cnt-1) % 7) + 1], rec.order_date, rec.order_date, rec.total_amount, 0, 1, 'Payment for ' || rec.so_no, '{}', 1, 1, 1);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. LEDGERS for today's payments
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO ledgers (activity_date, activity_type, details, mode_of_payment, debited_amount, credited_amount, remaining_balance, customer_id, customer_name, note, external_details, payment_id, invoice_id)
SELECT
  pay.payment_date, 1, ARRAY['Sale payment'], 1,
  pay.amount, 0, cust.balance, cust.id, cust.name,
  'Mock extra payment for ' || so.no, '{}', pay.id, pay.invoice_id
FROM payments pay
JOIN invoices inv ON inv.id = pay.invoice_id
JOIN sale_orders so ON so.id = inv.sale_order_id
JOIN customers cust ON cust.id = pay.customer_id
WHERE pay.no LIKE 'MOCK-XPAY-%' AND pay.invoice_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PURCHASE ORDERS (multiple statuses, spread across today and recent dates)
--    PO Status: IN_PROGRESS=2, PARTIALLY_RECEIVED=4, RECEIVED=5, CLOSED=6
-- ─────────────────────────────────────────────────────────────────────────────
-- Get supplier IDs
DO $$
DECLARE
  sup_ids INT[];
  s1 INT; s2 INT; s3 INT; s4 INT; s5 INT;
BEGIN
  SELECT array_agg(id ORDER BY id) INTO sup_ids FROM suppliers WHERE supplier_name LIKE 'Mock %';
  s1:=sup_ids[1]; s2:=sup_ids[2]; s3:=sup_ids[3]; s4:=sup_ids[4]; s5:=sup_ids[5];

  -- Today's POs
  INSERT INTO purchase_orders (no, supplier_id, channel_id, delivery_date, order_date, status, total_price, history, external_details, files, total_item_count, total_qty, created_by_id) VALUES
  ('MOCK-PO-0001', s1, 1, '2026-02-10 00:00:00', '2026-02-05 08:00:00', 2, 15000.00, '[]', '{}', '[]', 3, 25, 1),  -- IN_PROGRESS
  ('MOCK-PO-0002', s3, 1, '2026-02-08 00:00:00', '2026-02-05 09:00:00', 2, 3500.00,  '[]', '{}', '[]', 4, 200, 1), -- IN_PROGRESS
  ('MOCK-PO-0003', s5, 1, '2026-02-07 00:00:00', '2026-02-05 10:00:00', 4, 2800.00,  '[]', '{}', '[]', 2, 50, 1),  -- PARTIALLY_RECEIVED
  ('MOCK-PO-0004', s2, 1, '2026-02-06 00:00:00', '2026-02-05 08:30:00', 5, 8200.00,  '[]', '{}', '[]', 3, 40, 1),  -- RECEIVED
  ('MOCK-PO-0005', s4, 1, '2026-02-05 00:00:00', '2026-02-05 07:00:00', 6, 4500.00,  '[]', '{}', '[]', 2, 30, 1);  -- CLOSED

  -- Recent POs (last few days)
  INSERT INTO purchase_orders (no, supplier_id, channel_id, delivery_date, order_date, status, total_price, history, external_details, files, total_item_count, total_qty, created_by_id) VALUES
  ('MOCK-PO-0006', s1, 1, '2026-02-04 00:00:00', '2026-02-03 09:00:00', 6, 12500.00, '[]', '{}', '[]', 4, 20, 1),  -- CLOSED
  ('MOCK-PO-0007', s3, 1, '2026-02-05 00:00:00', '2026-02-04 10:00:00', 5, 5200.00,  '[]', '{}', '[]', 5, 300, 1), -- RECEIVED
  ('MOCK-PO-0008', s2, 1, '2026-02-06 00:00:00', '2026-02-04 11:00:00', 4, 6800.00,  '[]', '{}', '[]', 3, 45, 1);  -- PARTIALLY_RECEIVED
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PURCHASE ORDER DETAILS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO purchase_order_details (purchase_order_id, product_id, unit, lowest_unit_definition, default_qty, ordered_qty, received_qty, supply_price, total_price, position)
SELECT po.id, p.id, 1, 1, 1, v.ordered_qty, v.received_qty, v.supply_price, v.ordered_qty * v.supply_price, v.pos
FROM (VALUES
  -- PO-0001: TechGlobal - Electronics restock
  ('MOCK-PO-0001','MOCK00000001', 10, 0,  799.00, 1),
  ('MOCK-PO-0001','MOCK00000002', 10, 0,  680.00, 2),
  ('MOCK-PO-0001','MOCK00000006', 5,  0,  160.00, 3),
  -- PO-0002: FreshSource - Food restock
  ('MOCK-PO-0002','MOCK00000011', 50, 0,  1.20, 1),
  ('MOCK-PO-0002','MOCK00000012', 50, 0,  0.80, 2),
  ('MOCK-PO-0002','MOCK00000013', 50, 0,  0.65, 3),
  ('MOCK-PO-0002','MOCK00000014', 50, 0,  0.35, 4),
  -- PO-0003: ActiveGear - Partially received sports goods
  ('MOCK-PO-0003','MOCK00000017', 30, 15, 12.00, 1),
  ('MOCK-PO-0003','MOCK00000018', 20, 8,  45.00, 2),
  -- PO-0004: FashionDirect - Received clothing
  ('MOCK-PO-0004','MOCK00000007', 20, 20, 8.00,  1),
  ('MOCK-PO-0004','MOCK00000008', 10, 10, 22.00, 2),
  ('MOCK-PO-0004','MOCK00000010', 10, 10, 95.00, 3),
  -- PO-0005: HomeWorks - Closed home goods
  ('MOCK-PO-0005','MOCK00000015', 15, 15, 38.00, 1),
  ('MOCK-PO-0005','MOCK00000016', 15, 15, 180.00,2),
  -- PO-0006: Historical closed
  ('MOCK-PO-0006','MOCK00000003', 10, 10, 1850.00, 1),
  ('MOCK-PO-0006','MOCK00000004', 5,  5,  1050.00, 2),
  ('MOCK-PO-0006','MOCK00000005', 3,  3,  220.00,  3),
  ('MOCK-PO-0006','MOCK00000006', 2,  2,  160.00,  4),
  -- PO-0007: Historical received
  ('MOCK-PO-0007','MOCK00000011', 100, 100, 1.20, 1),
  ('MOCK-PO-0007','MOCK00000012', 80,  80,  0.80, 2),
  ('MOCK-PO-0007','MOCK00000013', 60,  60,  0.65, 3),
  ('MOCK-PO-0007','MOCK00000014', 40,  40,  0.35, 4),
  ('MOCK-PO-0007','MOCK00000017', 20,  20,  12.00,5),
  -- PO-0008: Historical partially received
  ('MOCK-PO-0008','MOCK00000009', 20, 10, 25.00, 1),
  ('MOCK-PO-0008','MOCK00000010', 15, 8,  95.00, 2),
  ('MOCK-PO-0008','MOCK00000008', 10, 5,  22.00, 3)
) AS v(po_no, sku, ordered_qty, received_qty, supply_price, pos)
JOIN purchase_orders po ON po.no = v.po_no
JOIN products p ON p.sku = v.sku;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. UPDATE historical sale orders to also cover recent dates
--    (so the dashboard shows data even with a wider date range)
-- ─────────────────────────────────────────────────────────────────────────────

-- Add more orders for Feb 3 and Feb 4 so there's a trend
INSERT INTO sale_orders (no, customer_id, order_type, sale_type, status, is_picked, is_packed, fulfilment_status, shipping_type, cash_n_carry, total_price, sub_total, tax, tax_type, discount, discount_type, total_discount, order_date, channel_id, created_by_id, customer_name, number_of_items, total_qty)
SELECT v.no, c.id, v.order_type, v.sale_type, v.status, v.is_picked, v.is_packed, v.fulfilment_status, v.shipping_type, v.cash_n_carry, v.total_price, v.sub_total, v.tax, v.tax_type, v.discount, v.discount_type, v.total_discount, v.order_date::timestamp, v.channel_id, 1, v.customer_name, v.number_of_items, v.total_qty
FROM (VALUES
  -- Feb 3 orders
  ('MOCK-XSO-0101','MOCK0002',1,1,50,true,true,3,1,'Y', 1899.88, 1727.16, 172.72, 1, 0.00, 2, 0.00,'2026-02-03 10:00:00',1,'Sarah Johnson',2,2),
  ('MOCK-XSO-0102','MOCK0007',1,1,50,true,true,3,1,'Y', 5498.89, 4998.99, 499.90, 1, 0.00, 2, 0.00,'2026-02-03 11:00:00',1,'Robert Taylor',2,2),
  ('MOCK-XSO-0103','MOCK0004',1,1,50,true,true,3,1,'Y',   32.87,   29.88, 2.99, 1, 0.00, 2, 0.00,'2026-02-03 14:00:00',1,'Emily Davis',3,8),
  -- Feb 4 orders
  ('MOCK-XSO-0104','MOCK0011',1,1,50,true,true,3,1,'Y',  439.89,  399.90, 39.99, 1, 0.00, 2, 0.00,'2026-02-04 09:00:00',1,'Thomas Anderson',1,1),
  ('MOCK-XSO-0105','MOCK0003',2,1,50,true,true,3,1,'N',  999.89,  908.99, 90.90, 1, 0.00, 2, 0.00,'2026-02-04 12:00:00',1,'Michael Chen',1,1),
  ('MOCK-XSO-0106','MOCK0005',1,1,50,true,true,3,1,'Y',  349.89,  318.08, 31.81, 1, 0.00, 2, 0.00,'2026-02-04 14:00:00',1,'David Wilson',2,3),
  ('MOCK-XSO-0107','MOCK0008',1,1,40,true,true,1,1,'Y',  109.89,   99.90, 9.99, 1, 0.00, 2, 0.00,'2026-02-04 15:00:00',1,'Jennifer Brown',2,4)
) AS v(no, cust_no, order_type, sale_type, status, is_picked, is_packed, fulfilment_status, shipping_type, cash_n_carry, total_price, sub_total, tax, tax_type, discount, discount_type, total_discount, order_date, channel_id, customer_name, number_of_items, total_qty)
JOIN customers c ON c.no = v.cust_no;

-- Line items for Feb 3-4 orders
INSERT INTO sale_order_details (
  sale_order_id, product_id, qty, order_qty, picked_qty, packed_qty, delivered_qty, return_qty,
  unit_price, unit_cost, unit, lowest_unit_definition, default_qty,
  discount_type, discount, scannables, unit_price_data, unit_price_id,
  product_name, product_images, is_custom_price
)
SELECT
  so.id, p.id, v.qty, v.qty,
  CASE WHEN so.status IN (23,30,40,50) THEN v.qty ELSE 0 END,
  CASE WHEN so.status IN (30,40,50) THEN v.qty ELSE 0 END,
  CASE WHEN so.status = 50 THEN v.qty ELSE 0 END,
  0, up.price, up.cost, 1, 1, 1,
  2, 0, '{}', '{}', up.id, v.pname, '[]', false
FROM (VALUES
  ('MOCK-XSO-0101','MOCK00000002',1,'Samsung Galaxy S24 Ultra'),
  ('MOCK-XSO-0101','MOCK00000001',1,'iPhone 15 Pro Max'),
  ('MOCK-XSO-0102','MOCK00000003',1,'MacBook Pro 16" M3 Max'),
  ('MOCK-XSO-0102','MOCK00000004',1,'Dell XPS 15'),
  ('MOCK-XSO-0103','MOCK00000011',3,'Organic Potato Chips'),
  ('MOCK-XSO-0103','MOCK00000013',3,'Energy Boost Drink'),
  ('MOCK-XSO-0103','MOCK00000014',2,'Sparkling Mineral Water'),
  ('MOCK-XSO-0104','MOCK00000016',1,'Robot Vacuum Cleaner'),
  ('MOCK-XSO-0105','MOCK00000002',1,'Samsung Galaxy S24 Ultra'),
  ('MOCK-XSO-0106','MOCK00000005',1,'Sony WH-1000XM5'),
  ('MOCK-XSO-0106','MOCK00000017',2,'Premium Yoga Mat 6mm'),
  ('MOCK-XSO-0106','MOCK00000011',1,'Organic Potato Chips'),  -- added to make qty=3
  ('MOCK-XSO-0107','MOCK00000007',2,'Classic Cotton T-Shirt'),
  ('MOCK-XSO-0107','MOCK00000012',2,'Dark Chocolate Bar 72%')
) AS v(sono, sku, qty, pname)
JOIN sale_orders so ON so.no = v.sono
JOIN products p ON p.sku = v.sku
JOIN unit_prices up ON up.product_id = p.id;

-- Invoices for Feb 3-4 completed orders
INSERT INTO invoices (sale_order_id, customer_id, no, status, sub_total, total_amount, total_discount, remaining_amount)
SELECT so.id, so.customer_id,
  'MOCK-XINV-' || LPAD((100 + ROW_NUMBER() OVER (ORDER BY so.no))::text, 4, '0'),
  3, so.sub_total, so.total_price, COALESCE(so.total_discount, 0), 0
FROM sale_orders so
WHERE so.no IN ('MOCK-XSO-0101','MOCK-XSO-0102','MOCK-XSO-0103','MOCK-XSO-0104','MOCK-XSO-0105','MOCK-XSO-0106');

-- Payments for Feb 3-4 completed orders
DO $$
DECLARE
  rec RECORD;
  parent_pay_id INT;
  cnt INT := 100;
BEGIN
  FOR rec IN
    SELECT inv.id as inv_id, inv.customer_id, inv.total_amount, inv.no as inv_no,
           so.order_date, so.no as so_no
    FROM invoices inv
    JOIN sale_orders so ON so.id = inv.sale_order_id
    WHERE inv.no LIKE 'MOCK-XINV-01%'
    ORDER BY inv.no
  LOOP
    cnt := cnt + 1;
    INSERT INTO payments (no, invoice_id, customer_id, status, payment_type, payment_date, schedule_date, amount, remaining_amount, category, memo, external_details, source, performed_by, performer_id)
    VALUES ('MOCK-XPAY-' || LPAD(cnt::text, 4, '0'), NULL, rec.customer_id, 2, 1, rec.order_date, rec.order_date, rec.total_amount, 0, 1, 'Payment for ' || rec.so_no, '{}', 1, 1, 1)
    RETURNING id INTO parent_pay_id;
    INSERT INTO payments (no, invoice_id, customer_id, parent_id, status, payment_type, payment_date, schedule_date, amount, remaining_amount, category, memo, external_details, source, performed_by, performer_id)
    VALUES ('MOCK-XPAY-' || LPAD(cnt::text, 4, '0') || 'C', rec.inv_id, rec.customer_id, parent_pay_id, 2, 1, rec.order_date, rec.order_date, rec.total_amount, 0, 1, 'Payment for ' || rec.so_no, '{}', 1, 1, 1);
  END LOOP;
END $$;

COMMIT;
