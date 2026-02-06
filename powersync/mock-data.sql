-- =============================================================================
-- KHUB Retail POS System - Complete Mock Data
-- =============================================================================
-- Designed against actual database schema (dev_1_2602a)
-- Respects all NOT NULL constraints, FK relations, and business enums
-- =============================================================================
-- Key Enum References (from kapp/server/constants/__init__.py):
--   ProductStatus: ACTIVE=1, INACTIVE=2, DISCONTINUED=3
--   ProductUnit:   PIECE=1, PACK=2, CASE=3, PALLET=4
--   WeightUnit:    OZ=1, LB=2, KG=3, G=4
--   StockStatus:   IN_HAND=6
--   OrderType:     WALK_IN=1, PHONE=2, ONLINE=3
--   SaleType:      ORDER=1, RETURN=2
--   SaleOrderStatus: PENDING=10, EXECUTED=40, COMPLETED=50, PARKED=70, VOID=90
--   InvoiceStatus: DUE=1, UN_PAID=2, PAID=3, PARTIALLY_PAID=5, VOID=8
--   PaymentType:   CASH=1, CHEQUE=2, CREDIT_DEBIT_GATEWAY=3, ON_ACCOUNT=6, CREDIT_DEBIT_TERMINAL=13
--   PaymentCategory: SALE_RECEIPT=1, SALE_REFUND=2
--   StorageType:   WAREHOUSE=0, STOREFRONT=1
--   CustomerStatus: COMPLETE=1
--   MarginType:    FIXED=... (using 1)
--   FulfilmentStatus: NOT_FULFILLED=1, COMPLETELY_FULFILLED=3
--   DiscountType:  PERCENTAGE=1, FIX=2
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEAN UP existing mock data (safe: only deletes our seeded data)
-- ─────────────────────────────────────────────────────────────────────────────
-- Order: child tables first, then parents
DELETE FROM ledgers WHERE note LIKE 'Mock%';
DELETE FROM payments WHERE no LIKE 'MOCK-PAY-%';
DELETE FROM invoices WHERE no LIKE 'MOCK-INV-%';
DELETE FROM sale_order_details WHERE sale_order_id IN (SELECT id FROM sale_orders WHERE no LIKE 'MOCK-SO-%');
DELETE FROM sale_orders WHERE no LIKE 'MOCK-SO-%';
DELETE FROM customer_groups_customer WHERE customer_id IN (SELECT id FROM customers WHERE no LIKE 'MOCK%');
DELETE FROM stocks WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'MOCK%');
DELETE FROM unit_prices WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'MOCK%');
DELETE FROM product_channel WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'MOCK%');
DELETE FROM categories_products WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'MOCK%');
DELETE FROM products_tags WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'MOCK%');
DELETE FROM products WHERE sku LIKE 'MOCK%';
DELETE FROM customers WHERE no LIKE 'MOCK%';
DELETE FROM suppliers WHERE supplier_name LIKE 'Mock %';
DELETE FROM tags WHERE value LIKE 'Mock:%';

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TAGS (no FK deps)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO tags (value, external_details) VALUES
('Mock:New Arrival', '{}'),
('Mock:Best Seller', '{}'),
('Mock:On Sale',     '{}'),
('Mock:Premium',     '{}'),
('Mock:Clearance',   '{}');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SUPPLIERS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO suppliers (supplier_name, first_name, last_name, email, phone, balance, external_details) VALUES
('Mock TechGlobal Supply',   'James',  'Chen',    'james@techglobal.com',   '(212)-555-0101', -12500.00, '{}'),
('Mock Fashion Direct LLC',  'Maria',  'Santos',  'maria@fashiondirect.com','(310)-555-0202', -8300.50,  '{}'),
('Mock FreshSource Foods',   'Ahmed',  'Hassan',  'ahmed@freshsource.com',  '(713)-555-0303', -4200.00,  '{}'),
('Mock HomeWorks Dist',      'Linda',  'Park',    'linda@homeworks.com',    '(480)-555-0404', -6100.00,  '{}'),
('Mock ActiveGear Co',       'Robert', 'Wilson',  'robert@activegear.com',  '(646)-555-0505', -3800.00,  '{}');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CUSTOMERS  (30 customers, business_name is NOT NULL)
--    Existing: tenant_user id=1, channel id=1, tiers 1-5, brands 11-15,
--              categories 7-18, customer_groups 1-4
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO customers (no, name, email, business_name, phone_no, business_city, business_state, business_country, business_zip_code, address, balance, balance_limit, status, allow_ecom, external_details, class_of_trades, tier_id, sale_rep_id) VALUES
('MOCK0001', 'John Smith',      'john.smith@mock.com',       'Smith Convenience',       '(212)-555-1001', 'New York',      'NY', 'United States', '10001', '123 Broadway, New York, NY',      2500.00, 10000.00, 1, 'Y', '{}', 'Retailer', 1, 1),
('MOCK0002', 'Sarah Johnson',   'sarah.j@mock.com',          'Johnson Market',          '(310)-555-1002', 'Los Angeles',   'CA', 'United States', '90001', '456 Sunset Blvd, LA, CA',         1200.00, 8000.00,  1, 'Y', '{}', 'Retailer', 2, 1),
('MOCK0003', 'Michael Chen',    'michael.c@mock.com',        'Chen Trading Co',         '(312)-555-1003', 'Chicago',       'IL', 'United States', '60601', '789 Michigan Ave, Chicago, IL',   -3500.00,50000.00, 1, 'Y', '{}', 'Distributor', 1, 1),
('MOCK0004', 'Emily Davis',     'emily.d@mock.com',          'Davis Grocery',           '(713)-555-1004', 'Houston',       'TX', 'United States', '77001', '321 Main St, Houston, TX',        800.00,  5000.00,  1, 'N', '{}', 'Retailer', 3, 1),
('MOCK0005', 'David Wilson',    'david.w@mock.com',          'Wilson Electronics',      '(602)-555-1005', 'Phoenix',       'AZ', 'United States', '85001', '654 Desert Rd, Phoenix, AZ',      5000.00, 25000.00, 1, 'Y', '{}', 'Retailer', 1, 1),
('MOCK0006', 'Lisa Martinez',   'lisa.m@mock.com',           'Martinez Corner Store',   '(215)-555-1006', 'Philadelphia',  'PA', 'United States', '19101', '987 Broad St, Philadelphia, PA',  300.00,  3000.00,  1, 'N', '{}', 'Retailer', 4, 1),
('MOCK0007', 'Robert Taylor',   'robert.t@mock.com',         'Taylor Wholesale',        '(210)-555-1007', 'San Antonio',   'TX', 'United States', '78201', '147 Commerce St, San Antonio, TX',-8000.00,60000.00, 1, 'Y', '{}', 'Distributor', 1, 1),
('MOCK0008', 'Jennifer Brown',  'jennifer.b@mock.com',       'Brown Family Store',      '(619)-555-1008', 'San Diego',     'CA', 'United States', '92101', '258 Harbor Dr, San Diego, CA',    1500.00, 7000.00,  1, 'Y', '{}', 'Retailer', 2, 1),
('MOCK0009', 'William Lee',     'william.l@mock.com',        'Lee Quick Stop',          '(214)-555-1009', 'Dallas',        'TX', 'United States', '75201', '369 Elm St, Dallas, TX',          450.00,  4000.00,  1, 'N', '{}', 'Retailer', 3, 1),
('MOCK0010', 'Amanda Garcia',   'amanda.g@mock.com',         'Garcia Mini Mart',        '(408)-555-1010', 'San Jose',      'CA', 'United States', '95101', '741 First St, San Jose, CA',      -1200.00,8000.00,  1, 'Y', '{}', 'Retailer', 2, 1),
('MOCK0011', 'Thomas Anderson', 'thomas.a@mock.com',         'Anderson Supply',         '(512)-555-1011', 'Austin',        'TX', 'United States', '73301', '852 Congress Ave, Austin, TX',    3200.00, 15000.00, 1, 'Y', '{}', 'Distributor', 1, 1),
('MOCK0012', 'Jessica White',   'jessica.w@mock.com',        'White Goods Shop',        '(904)-555-1012', 'Jacksonville',  'FL', 'United States', '32099', '963 Beach Blvd, Jacksonville, FL',600.00,  5000.00,  1, 'N', '{}', 'Retailer', 4, 1),
('MOCK0013', 'Daniel Harris',   'daniel.h@mock.com',         'Harris Depot',            '(614)-555-1013', 'Columbus',      'OH', 'United States', '43085', '159 High St, Columbus, OH',       -500.00, 6000.00,  1, 'Y', '{}', 'Retailer', 3, 1),
('MOCK0014', 'Michelle Clark',  'michelle.c@mock.com',       'Clark Retail Group',      '(704)-555-1014', 'Charlotte',     'NC', 'United States', '28201', '753 Trade St, Charlotte, NC',     4800.00, 30000.00, 1, 'Y', '{}', 'Distributor', 1, 1),
('MOCK0015', 'Christopher King','chris.k@mock.com',          'King Variety',            '(317)-555-1015', 'Indianapolis',  'IN', 'United States', '46201', '486 Market St, Indianapolis, IN', 200.00,  3500.00,  1, 'N', '{}', 'Retailer', 5, 1),
('MOCK0016', 'Patricia Lewis',  'patricia.l@mock.com',       'Lewis General Store',     '(415)-555-1016', 'San Francisco', 'CA', 'United States', '94101', '951 Mission St, San Francisco',   1800.00, 9000.00,  1, 'Y', '{}', 'Retailer', 2, 1),
('MOCK0017', 'Kevin Robinson',  'kevin.r@mock.com',          'Robinson Market Place',   '(206)-555-1017', 'Seattle',       'WA', 'United States', '98101', '357 Pike St, Seattle, WA',        -200.00, 7500.00,  1, 'Y', '{}', 'Retailer', 3, 1),
('MOCK0018', 'Nancy Walker',    'nancy.w@mock.com',          'Walker Distributors Inc',  '(303)-555-1018', 'Denver',        'CO', 'United States', '80201', '862 Colfax Ave, Denver, CO',     -15000.00,80000.00,1, 'Y', '{}', 'Distributor', 1, 1),
('MOCK0019', 'Mark Hall',       'mark.h@mock.com',           'Hall Neighborhood Shop',  '(617)-555-1019', 'Boston',        'MA', 'United States', '02101', '246 Boylston St, Boston, MA',     900.00,  4500.00,  1, 'N', '{}', 'Retailer', 4, 1),
('MOCK0020', 'Karen Young',     'karen.y@mock.com',          'Young Fresh Mart',        '(503)-555-1020', 'Portland',      'OR', 'United States', '97201', '135 Burnside St, Portland, OR',   350.00,  3000.00,  1, 'Y', '{}', 'Retailer', 5, 1);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CUSTOMER ↔ GROUP assignments
-- ─────────────────────────────────────────────────────────────────────────────
-- VIP (group 1): top spenders
INSERT INTO customer_groups_customer (customer_group_id, customer_id) SELECT 1, id FROM customers WHERE no IN ('MOCK0003','MOCK0005','MOCK0007','MOCK0011','MOCK0014','MOCK0018');
-- Regular (group 2)
INSERT INTO customer_groups_customer (customer_group_id, customer_id) SELECT 2, id FROM customers WHERE no IN ('MOCK0001','MOCK0002','MOCK0008','MOCK0010','MOCK0016');
-- Wholesale (group 3)
INSERT INTO customer_groups_customer (customer_group_id, customer_id) SELECT 3, id FROM customers WHERE no IN ('MOCK0004','MOCK0009','MOCK0013','MOCK0017');
-- New (group 4)
INSERT INTO customer_groups_customer (customer_group_id, customer_id) SELECT 4, id FROM customers WHERE no IN ('MOCK0006','MOCK0012','MOCK0015','MOCK0019','MOCK0020');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PRODUCTS (18 products across all brand/category combos)
--    brand_id: 11=TechPro 12=FashionHub 13=FreshMart 14=HomeStyle 15=SportMax
--    category_id: 12=Smartphones 13=Laptops 14=Headphones
--                 15=Mens 16=Womens 17=Snacks 18=Beverages
--                 10=Home&Garden 11=Sports
--    ProductStatus: ACTIVE=1   WeightUnit: OZ=1,LB=2,KG=3,G=4
--    sku uses get_new_sku() by default, but we set explicit MOCK-prefixed ones
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO products (name, brand_id, main_category_id, slug, is_online, status, weight, weight_unit, sku, upc, description, sold_count) VALUES
-- Electronics / TechPro (brand 11)
('iPhone 15 Pro Max',      11, 12, 'iphone-15-pro-max',       true, 1, 6.7,  1, 'MOCK00000001', '194253945310', 'Latest Apple flagship smartphone with A17 Pro chip',          385),
('Samsung Galaxy S24 Ultra',11, 12, 'samsung-galaxy-s24-ultra',true, 1, 8.2,  1, 'MOCK00000002', '887276724744', 'Premium Android smartphone with Galaxy AI',                   312),
('MacBook Pro 16" M3 Max', 11, 13, 'macbook-pro-16-m3-max',   true, 1, 4.7,  2, 'MOCK00000003', '194253220985', 'Professional laptop with M3 Max chip and 36GB RAM',           178),
('Dell XPS 15',            11, 13, 'dell-xps-15',             true, 1, 4.2,  2, 'MOCK00000004', '884116417460', 'Premium Windows laptop with OLED display',                    145),
('Sony WH-1000XM5',       11, 14, 'sony-wh-1000xm5',        true, 1, 8.8,  1, 'MOCK00000005', '027242923430', 'Industry-leading noise cancelling wireless headphones',       267),
('AirPods Pro 2',          11, 14, 'airpods-pro-2',           true, 1, 1.8,  1, 'MOCK00000006', '194253398318', 'Apple AirPods Pro with USB-C and adaptive audio',             410),
-- Clothing / FashionHub (brand 12)
('Classic Cotton T-Shirt', 12, 15, 'classic-cotton-tshirt',   true, 1, 7.0,  1, 'MOCK00000007', '889232100123', 'Premium cotton crew neck t-shirt, multiple colors',           520),
('Slim Fit Denim Jeans',   12, 15, 'slim-fit-denim-jeans',    true, 1, 1.8,  2, 'MOCK00000008', '889232100456', 'Classic slim fit jeans with stretch comfort',                 340),
('Floral Summer Dress',    12, 16, 'floral-summer-dress',     true, 1, 10.5, 1, 'MOCK00000009', '889232100789', 'Lightweight floral print dress for summer',                   295),
('Leather Bomber Jacket',  12, 15, 'leather-bomber-jacket',   true, 1, 3.5,  2, 'MOCK00000010', '889232101012', 'Genuine leather bomber jacket with satin lining',             180),
-- Food / FreshMart (brand 13)
('Organic Potato Chips',   13, 17, 'organic-potato-chips',    true, 1, 7.0,  1, 'MOCK00000011', '852345100111', 'Organic kettle-cooked chips, sea salt flavor, 200g',          890),
('Dark Chocolate Bar 72%', 13, 17, 'dark-chocolate-bar-72',   true, 1, 3.5,  1, 'MOCK00000012', '852345100222', 'Premium dark chocolate 72% cacao, 100g bar',                 650),
('Energy Boost Drink',     13, 18, 'energy-boost-drink',      true, 1, 1.1,  2, 'MOCK00000013', '852345100333', 'Natural energy drink with B vitamins, 500ml',                 720),
('Sparkling Mineral Water', 13, 18, 'sparkling-mineral-water', true, 1, 3.3,  2, 'MOCK00000014', '852345100444', 'Premium sparkling water from mountain springs, 1.5L',         480),
-- Home / HomeStyle (brand 14)
('Programmable Coffee Maker',14, 10, 'programmable-coffee-maker',true, 1, 5.5, 2, 'MOCK00000015', '763649100555', '12-cup programmable coffee maker with thermal carafe',       210),
('Robot Vacuum Cleaner',   14, 10, 'robot-vacuum-cleaner',    true, 1, 7.7,  2, 'MOCK00000016', '763649100666', 'Smart robot vacuum with LiDAR navigation and auto-empty',    165),
-- Sports / SportMax (brand 15)
('Premium Yoga Mat 6mm',   15, 11, 'premium-yoga-mat-6mm',    true, 1, 2.2,  2, 'MOCK00000017', '945671100777', 'Non-slip TPE yoga mat 6mm thick with carry strap',           330),
('Adjustable Dumbbell Set', 15, 11, 'adjustable-dumbbell-set', true, 1, 22.0, 2, 'MOCK00000018', '945671100888', 'Adjustable dumbbells 5-25 lb pair with stand',               195);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CATEGORIES_PRODUCTS (M2M: product ↔ category)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO categories_products (category_id, product_id)
SELECT c.id, p.id FROM
(VALUES
  ('iphone-15-pro-max',12),('samsung-galaxy-s24-ultra',12),('macbook-pro-16-m3-max',13),
  ('dell-xps-15',13),('sony-wh-1000xm5',14),('airpods-pro-2',14),
  ('classic-cotton-tshirt',15),('slim-fit-denim-jeans',15),('floral-summer-dress',16),
  ('leather-bomber-jacket',15),('organic-potato-chips',17),('dark-chocolate-bar-72',17),
  ('energy-boost-drink',18),('sparkling-mineral-water',18),('programmable-coffee-maker',10),
  ('robot-vacuum-cleaner',10),('premium-yoga-mat-6mm',11),('adjustable-dumbbell-set',11)
) AS v(slug, cat_id)
JOIN products p ON p.slug = v.slug
JOIN categories c ON c.id = v.cat_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PRODUCT_CHANNEL (link each product to channel 1 = Primary)
--    sold_by_unit=1 (PIECE), bought_by_unit=1 (PIECE)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO product_channel (channel_id, channel_name, product_id, sold_by_unit, bought_by_unit)
SELECT 1, 'Primary', id, 1, 1 FROM products WHERE sku LIKE 'MOCK%';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. UNIT_PRICES (one per product, linked to product_channel)
--    unit=1 (PIECE), definition=1, lowest_unit_definition=1
--    margin_type=1 (FIXED), default_qty=1, default_unit=1
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO unit_prices (
  product_channel_id, product_id, channel_id,
  unit, unit_name, sold_by_unit, bought_by_unit,
  cost, base_cost, margin, margin_type, price, ecom_price, lowest_selling_price, msrp_price,
  definition, lowest_unit_definition, default_qty, default_unit, upc
)
SELECT
  pc.id, pc.product_id, pc.channel_id,
  1, 'Piece', 1, 1,
  v.cost, v.cost, v.price - v.cost, 1, v.price, v.ecom_price, v.cost, v.msrp,
  1, 1, 1, 1, COALESCE(p.upc, p.sku)
FROM product_channel pc
JOIN products p ON p.id = pc.product_id
JOIN (VALUES
  ('MOCK00000001', 799.00,  999.00,  949.00,  1099.00),
  ('MOCK00000002', 680.00,  899.99,  859.99,  999.99),
  ('MOCK00000003', 1850.00, 2499.00, 2399.00, 2799.00),
  ('MOCK00000004', 1050.00, 1499.99, 1449.99, 1699.99),
  ('MOCK00000005', 220.00,  349.99,  329.99,  399.99),
  ('MOCK00000006', 160.00,  249.99,  239.99,  279.99),
  ('MOCK00000007', 8.00,    24.99,   22.99,   29.99),
  ('MOCK00000008', 22.00,   59.99,   54.99,   79.99),
  ('MOCK00000009', 25.00,   69.99,   64.99,   89.99),
  ('MOCK00000010', 95.00,   249.99,  229.99,  299.99),
  ('MOCK00000011', 1.20,    3.99,    3.49,    4.99),
  ('MOCK00000012', 0.80,    2.99,    2.49,    3.99),
  ('MOCK00000013', 0.65,    2.49,    1.99,    3.49),
  ('MOCK00000014', 0.35,    1.49,    1.29,    1.99),
  ('MOCK00000015', 38.00,   79.99,   74.99,   99.99),
  ('MOCK00000016', 180.00,  399.99,  379.99,  499.99),
  ('MOCK00000017', 12.00,   34.99,   29.99,   44.99),
  ('MOCK00000018', 45.00,   99.99,   89.99,   129.99)
) AS v(sku, cost, price, ecom_price, msrp) ON p.sku = v.sku
WHERE p.sku LIKE 'MOCK%';

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. STOCKS (one per product in channel 1, status=6 IN_HAND)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO stocks (channel_id, product_id, qty, status)
SELECT 1, p.id, v.qty, 6
FROM products p
JOIN (VALUES
  ('MOCK00000001', 45), ('MOCK00000002', 38), ('MOCK00000003', 22), ('MOCK00000004', 30),
  ('MOCK00000005', 85), ('MOCK00000006', 120),('MOCK00000007', 350),('MOCK00000008', 200),
  ('MOCK00000009', 175),('MOCK00000010', 60), ('MOCK00000011', 500),('MOCK00000012', 400),
  ('MOCK00000013', 600),('MOCK00000014', 450),('MOCK00000015', 55), ('MOCK00000016', 25),
  ('MOCK00000017', 150),('MOCK00000018', 70)
) AS v(sku, qty) ON p.sku = v.sku;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. PRODUCTS_TAGS (some products get tags)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO products_tags (product_id, tag_id)
SELECT p.id, t.id FROM products p, tags t WHERE p.slug='iphone-15-pro-max' AND t.value='Mock:New Arrival'
UNION ALL
SELECT p.id, t.id FROM products p, tags t WHERE p.slug='airpods-pro-2' AND t.value='Mock:Best Seller'
UNION ALL
SELECT p.id, t.id FROM products p, tags t WHERE p.slug='classic-cotton-tshirt' AND t.value='Mock:Best Seller'
UNION ALL
SELECT p.id, t.id FROM products p, tags t WHERE p.slug='organic-potato-chips' AND t.value='Mock:Best Seller'
UNION ALL
SELECT p.id, t.id FROM products p, tags t WHERE p.slug='leather-bomber-jacket' AND t.value='Mock:On Sale'
UNION ALL
SELECT p.id, t.id FROM products p, tags t WHERE p.slug='robot-vacuum-cleaner' AND t.value='Mock:Premium';

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. SALE ORDERS (20 orders, covering various statuses and types)
--     order_type: WALK_IN=1, PHONE=2, ONLINE=3
--     sale_type: ORDER=1
--     status: COMPLETED=50, EXECUTED=40, PENDING=10, PARKED=70
--     fulfilment_status: NOT_FULFILLED=1, COMPLETELY_FULFILLED=3
--     shipping_type=1, tax_type=1, discount_type=2(FIX)
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: we'll use DO block to create orders with proper customer IDs
-- Use subqueries to get customer IDs by their 'no' field
INSERT INTO sale_orders (no, customer_id, order_type, sale_type, status, is_picked, is_packed, fulfilment_status, shipping_type, cash_n_carry, total_price, sub_total, tax, tax_type, discount, discount_type, total_discount, order_date, channel_id, created_by_id, customer_name, number_of_items, total_qty)
SELECT v.no, c.id, v.order_type, v.sale_type, v.status, v.is_picked, v.is_packed, v.fulfilment_status, v.shipping_type, v.cash_n_carry, v.total_price, v.sub_total, v.tax, v.tax_type, v.discount, v.discount_type, v.total_discount, v.order_date::timestamp, v.channel_id, 1, v.customer_name, v.number_of_items, v.total_qty
FROM (VALUES
  ('MOCK-SO-0001','MOCK0001',1,1,50,true,true,3,1,'Y',1099.89,999.90,99.99,1,0.00,2,0.00,'2025-08-15 10:30:00',1,'John Smith',2,3),
  ('MOCK-SO-0002','MOCK0003',1,1,50,true,true,3,1,'Y',3848.90,3498.99,349.91,1,0.00,2,0.00,'2025-08-20 14:15:00',1,'Michael Chen',3,4),
  ('MOCK-SO-0003','MOCK0005',2,1,50,true,true,3,1,'N',549.98,499.98,50.00,1,0.00,2,0.00,'2025-09-01 09:00:00',1,'David Wilson',2,2),
  ('MOCK-SO-0004','MOCK0007',1,1,50,true,true,3,1,'Y',2749.89,2499.90,249.99,1,0.00,2,0.00,'2025-09-10 11:45:00',1,'Robert Taylor',1,1),
  ('MOCK-SO-0005','MOCK0002',3,1,50,true,true,3,1,'N',164.97,149.97,15.00,1,0.00,2,0.00,'2025-09-15 16:30:00',1,'Sarah Johnson',3,5),
  ('MOCK-SO-0006','MOCK0008',1,1,50,true,true,3,1,'Y',439.98,399.98,40.00,1,0.00,2,0.00,'2025-09-22 13:00:00',1,'Jennifer Brown',1,1),
  ('MOCK-SO-0007','MOCK0010',1,1,50,true,true,3,1,'Y',87.97,79.97,7.99,1,0.00,2,0.00,'2025-10-01 10:00:00',1,'Amanda Garcia',2,4),
  ('MOCK-SO-0008','MOCK0004',2,1,50,true,true,3,1,'N',27.47,24.97,2.50,1,0.00,2,0.00,'2025-10-05 15:30:00',1,'Emily Davis',4,10),
  ('MOCK-SO-0009','MOCK0014',1,1,50,true,true,3,1,'Y',1979.89,1799.98,179.91,1,0.00,2,0.00,'2025-10-12 09:15:00',1,'Michelle Clark',2,2),
  ('MOCK-SO-0010','MOCK0006',3,1,50,true,true,3,1,'N',109.98,99.98,10.00,1,0.00,2,0.00,'2025-10-20 11:00:00',1,'Lisa Martinez',2,2),
  ('MOCK-SO-0011','MOCK0001',1,1,40,true,true,1,1,'Y',274.99,249.99,25.00,1,0.00,2,0.00,'2025-11-01 10:30:00',1,'John Smith',1,1),
  ('MOCK-SO-0012','MOCK0003',1,1,40,true,true,1,1,'Y',989.99,899.99,90.00,1,0.00,2,0.00,'2025-11-05 14:00:00',1,'Michael Chen',1,1),
  ('MOCK-SO-0013','MOCK0009',2,1,40,true,false,1,1,'N',38.49,34.99,3.50,1,0.00,2,0.00,'2025-11-10 09:30:00',1,'William Lee',1,1),
  ('MOCK-SO-0014','MOCK0002',3,1,10,false,false,1,1,'N',1649.89,1499.98,149.91,1,0.00,2,0.00,'2025-12-01 08:00:00',1,'Sarah Johnson',2,2),
  ('MOCK-SO-0015','MOCK0005',1,1,10,false,false,1,1,'Y',109.98,99.98,10.00,1,0.00,2,0.00,'2025-12-05 12:00:00',1,'David Wilson',1,1),
  ('MOCK-SO-0016','MOCK0008',1,1,10,false,false,1,1,'Y',76.98,69.98,7.00,1,0.00,2,0.00,'2025-12-10 15:00:00',1,'Jennifer Brown',2,3),
  ('MOCK-SO-0017','MOCK0004',1,1,70,false,false,1,1,'Y',384.89,349.90,34.99,1,0.00,2,0.00,'2025-12-15 10:00:00',1,'Emily Davis',2,2),
  ('MOCK-SO-0018','MOCK0006',2,1,70,false,false,1,1,'N',54.98,49.98,5.00,1,0.00,2,0.00,'2025-12-18 14:30:00',1,'Lisa Martinez',2,4),
  ('MOCK-SO-0019','MOCK0010',1,1,50,true,true,3,1,'Y',549.98,499.98,50.00,1,0.00,2,0.00,'2026-01-10 10:00:00',1,'Amanda Garcia',2,2),
  ('MOCK-SO-0020','MOCK0007',1,1,40,true,true,1,1,'Y',2749.89,2499.00,249.90,1,0.99,2,0.99,'2026-01-25 11:30:00',1,'Robert Taylor',1,1)
) AS v(no, cust_no, order_type, sale_type, status, is_picked, is_packed, fulfilment_status, shipping_type, cash_n_carry, total_price, sub_total, tax, tax_type, discount, discount_type, total_discount, order_date, channel_id, customer_name, number_of_items, total_qty)
JOIN customers c ON c.no = v.cust_no;

-- Use a single INSERT with JOINs to resolve IDs
-- Format: (order_no, product_sku, qty, product_name)
INSERT INTO sale_order_details (
  sale_order_id, product_id, qty, order_qty, picked_qty, packed_qty, delivered_qty, return_qty,
  unit_price, unit_cost, unit, lowest_unit_definition, default_qty,
  discount_type, discount, scannables, unit_price_data, unit_price_id,
  product_name, product_images, is_custom_price
)
SELECT
  so.id, p.id, v.qty, v.qty,
  CASE WHEN so.status IN (40,50) THEN v.qty ELSE 0 END,
  CASE WHEN so.status = 50 THEN v.qty ELSE 0 END,
  CASE WHEN so.status = 50 THEN v.qty ELSE 0 END,
  0,
  up.price, up.cost, 1, 1, 1,
  2, 0, '{}', '{}', up.id,
  v.pname, '[]', false
FROM (VALUES
  -- Order 1: John Smith buys iPhone + 2x AirPods
  ('MOCK-SO-0001', 'MOCK00000001', 1, 'iPhone 15 Pro Max'),
  ('MOCK-SO-0001', 'MOCK00000006', 2, 'AirPods Pro 2'),
  -- Order 2: Michael Chen buys MacBook + 2x Sony + T-Shirt
  ('MOCK-SO-0002', 'MOCK00000003', 1, 'MacBook Pro 16" M3 Max'),
  ('MOCK-SO-0002', 'MOCK00000005', 2, 'Sony WH-1000XM5'),
  ('MOCK-SO-0002', 'MOCK00000007', 1, 'Classic Cotton T-Shirt'),
  -- Order 3: David Wilson buys 2x Sony headphones
  ('MOCK-SO-0003', 'MOCK00000005', 1, 'Sony WH-1000XM5'),
  ('MOCK-SO-0003', 'MOCK00000006', 1, 'AirPods Pro 2'),
  -- Order 4: Robert Taylor buys MacBook
  ('MOCK-SO-0004', 'MOCK00000003', 1, 'MacBook Pro 16" M3 Max'),
  -- Order 5: Sarah Johnson grocery: Chips + Chocolate + Water
  ('MOCK-SO-0005', 'MOCK00000011', 2, 'Organic Potato Chips'),
  ('MOCK-SO-0005', 'MOCK00000012', 1, 'Dark Chocolate Bar 72%'),
  ('MOCK-SO-0005', 'MOCK00000014', 2, 'Sparkling Mineral Water'),
  -- Order 6: Jennifer Brown buys Robot Vacuum
  ('MOCK-SO-0006', 'MOCK00000016', 1, 'Robot Vacuum Cleaner'),
  -- Order 7: Amanda Garcia buys Yoga Mat + Chips
  ('MOCK-SO-0007', 'MOCK00000017', 2, 'Premium Yoga Mat 6mm'),
  ('MOCK-SO-0007', 'MOCK00000011', 2, 'Organic Potato Chips'),
  -- Order 8: Emily Davis bulk snacks
  ('MOCK-SO-0008', 'MOCK00000011', 3, 'Organic Potato Chips'),
  ('MOCK-SO-0008', 'MOCK00000012', 2, 'Dark Chocolate Bar 72%'),
  ('MOCK-SO-0008', 'MOCK00000013', 3, 'Energy Boost Drink'),
  ('MOCK-SO-0008', 'MOCK00000014', 2, 'Sparkling Mineral Water'),
  -- Order 9: Michelle Clark buys Samsung + Dell XPS
  ('MOCK-SO-0009', 'MOCK00000002', 1, 'Samsung Galaxy S24 Ultra'),
  ('MOCK-SO-0009', 'MOCK00000004', 1, 'Dell XPS 15'),
  -- Order 10: Lisa Martinez buys Dumbbells + Yoga Mat
  ('MOCK-SO-0010', 'MOCK00000018', 1, 'Adjustable Dumbbell Set'),
  ('MOCK-SO-0010', 'MOCK00000017', 1, 'Premium Yoga Mat 6mm'),
  -- Order 11: John Smith buys Leather Jacket
  ('MOCK-SO-0011', 'MOCK00000010', 1, 'Leather Bomber Jacket'),
  -- Order 12: Michael Chen buys Samsung phone
  ('MOCK-SO-0012', 'MOCK00000002', 1, 'Samsung Galaxy S24 Ultra'),
  -- Order 13: William Lee buys Yoga Mat
  ('MOCK-SO-0013', 'MOCK00000017', 1, 'Premium Yoga Mat 6mm'),
  -- Order 14: Sarah Johnson online - Dell + iPhone
  ('MOCK-SO-0014', 'MOCK00000004', 1, 'Dell XPS 15'),
  ('MOCK-SO-0014', 'MOCK00000001', 1, 'iPhone 15 Pro Max'),
  -- Order 15: David Wilson pending - Dumbbells
  ('MOCK-SO-0015', 'MOCK00000018', 1, 'Adjustable Dumbbell Set'),
  -- Order 16: Jennifer Brown pending - Dress + T-Shirt
  ('MOCK-SO-0016', 'MOCK00000009', 1, 'Floral Summer Dress'),
  ('MOCK-SO-0016', 'MOCK00000007', 2, 'Classic Cotton T-Shirt'),
  -- Order 17: Emily Davis parked - Sony + AirPods
  ('MOCK-SO-0017', 'MOCK00000005', 1, 'Sony WH-1000XM5'),
  ('MOCK-SO-0017', 'MOCK00000006', 1, 'AirPods Pro 2'),
  -- Order 18: Lisa Martinez parked - Chips + Energy Drinks
  ('MOCK-SO-0018', 'MOCK00000011', 2, 'Organic Potato Chips'),
  ('MOCK-SO-0018', 'MOCK00000013', 2, 'Energy Boost Drink'),
  -- Order 19: Amanda Garcia recent - Coffee Maker + Jeans
  ('MOCK-SO-0019', 'MOCK00000015', 1, 'Programmable Coffee Maker'),
  ('MOCK-SO-0019', 'MOCK00000008', 1, 'Slim Fit Denim Jeans'),
  -- Order 20: Robert Taylor recent - MacBook
  ('MOCK-SO-0020', 'MOCK00000003', 1, 'MacBook Pro 16" M3 Max')
) AS v(sono, sku, qty, pname)
JOIN sale_orders so ON so.no = v.sono
JOIN products p ON p.sku = v.sku
JOIN unit_prices up ON up.product_id = p.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. INVOICES (for completed orders, status: PAID=3)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO invoices (sale_order_id, customer_id, no, status, sub_total, total_amount, total_discount, remaining_amount)
SELECT so.id, so.customer_id, 'MOCK-INV-' || LPAD(ROW_NUMBER() OVER (ORDER BY so.no)::text, 4, '0'), 3,
       so.sub_total, so.total_price, COALESCE(so.total_discount, 0), 0
FROM sale_orders so
WHERE so.no LIKE 'MOCK-SO-%' AND so.status = 50;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. PAYMENTS
--     Payment model requires parent→child structure:
--       Parent: invoice_id=NULL, parent_id=NULL
--       Child:  invoice_id=SET, parent_id=parent.id
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  rec RECORD;
  parent_pay_id INT;
  cnt INT := 0;
BEGIN
  FOR rec IN
    SELECT inv.id as inv_id, inv.customer_id, inv.total_amount, inv.no as inv_no,
           so.order_date, so.no as so_no
    FROM invoices inv
    JOIN sale_orders so ON so.id = inv.sale_order_id
    WHERE inv.no LIKE 'MOCK-INV-%'
    ORDER BY inv.no
  LOOP
    cnt := cnt + 1;
    -- Parent payment (no invoice_id)
    INSERT INTO payments (no, invoice_id, customer_id, status, payment_type, payment_date, schedule_date, amount, remaining_amount, category, memo, external_details, source, performed_by, performer_id)
    VALUES ('MOCK-PAY-' || LPAD(cnt::text, 4, '0'), NULL, rec.customer_id, 2, 1, rec.order_date, rec.order_date, rec.total_amount, 0, 1, 'Payment for ' || rec.so_no, '{}', 1, 1, 1)
    RETURNING id INTO parent_pay_id;

    -- Child payment (with invoice_id + parent_id)
    INSERT INTO payments (no, invoice_id, customer_id, parent_id, status, payment_type, payment_date, schedule_date, amount, remaining_amount, category, memo, external_details, source, performed_by, performer_id)
    VALUES ('MOCK-PAY-' || LPAD(cnt::text, 4, '0') || 'C', rec.inv_id, rec.customer_id, parent_pay_id, 2, 1, rec.order_date, rec.order_date, rec.total_amount, 0, 1, 'Payment for ' || rec.so_no, '{}', 1, 1, 1);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. LEDGERS (for completed order payments)
--     activity_type: 1=SALE, mode_of_payment: 1=CASH
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO ledgers (activity_date, activity_type, details, mode_of_payment, debited_amount, credited_amount, remaining_balance, customer_id, customer_name, note, external_details, payment_id, invoice_id)
SELECT
  pay.payment_date, 1, ARRAY['Sale payment'], 1,
  pay.amount, 0, cust.balance, cust.id, cust.name,
  'Mock payment for ' || so.no, '{}', pay.id, pay.invoice_id
FROM payments pay
JOIN invoices inv ON inv.id = pay.invoice_id
JOIN sale_orders so ON so.id = inv.sale_order_id
JOIN customers cust ON cust.id = pay.customer_id
WHERE pay.no LIKE 'MOCK-PAY-%' AND pay.invoice_id IS NOT NULL;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- SELECT 'brands' as tbl, COUNT(*) FROM brands WHERE slug IN ('techpro','fashionhub','freshmart','homestyle','sportmax')
-- UNION ALL SELECT 'products', COUNT(*) FROM products WHERE sku LIKE 'MOCK%'
-- UNION ALL SELECT 'customers', COUNT(*) FROM customers WHERE no LIKE 'MOCK%'
-- UNION ALL SELECT 'sale_orders', COUNT(*) FROM sale_orders WHERE no LIKE 'MOCK-SO-%'
-- UNION ALL SELECT 'invoices', COUNT(*) FROM invoices WHERE no LIKE 'MOCK-INV-%'
-- UNION ALL SELECT 'payments', COUNT(*) FROM payments WHERE no LIKE 'MOCK-PAY-%';
