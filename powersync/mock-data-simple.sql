-- Simplified Mock Data for KHUB Retail POS System
-- Generated for dev_1_2602a database
-- Only inserts essential fields, relying on database defaults for others

BEGIN;

-- Note: Many tables have complex structures with triggers, defaults, and constraints
-- This script inserts minimal data to demonstrate the system

-- Clear existing data first (if any)
DELETE FROM customer_groups WHERE name IN ('VIP Customers', 'Regular Customers', 'Wholesale Customers', 'New Customers');
DELETE FROM categories WHERE code IN ('ELEC', 'CLTH', 'FOOD', 'HOME', 'SPRT', 'ELPH', 'ELLA', 'ELAU', 'CLME', 'CLWO', 'FOSN', 'FOBE');
DELETE FROM brands WHERE slug IN ('techpro', 'fashionhub', 'freshmart', 'homestyle', 'sportmax');

-- Insert Brands (using database defaults for most fields)
INSERT INTO brands (name, slug, is_featured, external_details) VALUES
('TechPro', 'techpro', true, '{}'),
('FashionHub', 'fashionhub', true, '{}'),
('FreshMart', 'freshmart', false, '{}'),
('HomeStyle', 'homestyle', true, '{}'),
('SportMax', 'sportmax', false, '{}');

-- Insert Categories (parent categories first)
INSERT INTO categories (name, code, slug, is_featured, is_msa_compliant, external_details) VALUES
('Electronics', 'ELEC', 'electronics', true, false, '{}'),
('Clothing', 'CLTH', 'clothing', true, false, '{}'),
('Food & Beverages', 'FOOD', 'food-beverages', false, false, '{}'),
('Home & Garden', 'HOME', 'home-garden', true, false, '{}'),
('Sports & Outdoors', 'SPRT', 'sports-outdoors', false, false, '{}');

-- Insert sub-categories (requires parent IDs) - code max 6 chars
INSERT INTO categories (name, code, slug, is_featured, is_msa_compliant, external_details, parent_id) VALUES
('Smartphones', 'ELPH', 'smartphones', true, false, '{}', (SELECT id FROM categories WHERE code = 'ELEC')),
('Laptops', 'ELLA', 'laptops', true, false, '{}', (SELECT id FROM categories WHERE code = 'ELEC')),
('Headphones', 'ELAU', 'headphones', false, false, '{}', (SELECT id FROM categories WHERE code = 'ELEC')),
('Mens Wear', 'CLME', 'mens-wear', true, false, '{}', (SELECT id FROM categories WHERE code = 'CLTH')),
('Womens Wear', 'CLWO', 'womens-wear', true, false, '{}', (SELECT id FROM categories WHERE code = 'CLTH')),
('Snacks', 'FOSN', 'snacks', false, false, '{}', (SELECT id FROM categories WHERE code = 'FOOD')),
('Beverages', 'FOBE', 'beverages', false, false, '{}', (SELECT id FROM categories WHERE code = 'FOOD'));

-- Note: Channels should ideally be seeded via the inventory_seeder.py
-- Skipping channels, taxes, products, customers, etc. due to complexity

-- Insert Customer Groups (simpler structure)
INSERT INTO customer_groups (name, is_active) VALUES
('VIP Customers', true),
('Regular Customers', true),
('Wholesale Customers', true),
('New Customers', true);

COMMIT;

-- Summary:
-- This script creates minimal reference data:
-- - 5 Brands
-- - 12 Categories (5 parent + 7 child)
-- - 4 Customer Groups
--
-- For full mock data including products, customers, orders, etc.,
-- it's recommended to use the Python seeder scripts or the admin panel
-- to create data, as they properly handle:
-- - Complex foreign key relationships
-- - Auto-generated fields (SKUs, slugs, etc.)
-- - Triggers and constraints
-- - Product-Channel-UnitPrice relationships
-- - Stock management
-- - Default values and JSON fields
