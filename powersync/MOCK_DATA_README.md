# Mock Data for Retail POS System

## 📋 Overview

This directory contains automatically generated mock data for testing and development purposes. The data is realistic, properly related, and covers all aspects of the retail POS system.

## 📊 Data Summary

The `mock-data.sql` file contains:

### Base Data (Reference Tables)
- **5 Brands**: TechPro, FashionHub, FreshMart, HomeStyle, SportMax
- **12 Categories**: Hierarchical structure with parent-child relationships
  - 5 top-level categories (Electronics, Clothing, Food & Beverages, Home & Garden, Sports & Outdoors)
  - 7 sub-categories
- **3 Sales Channels**: Main Store, Branch Store, E-Commerce
- **3 Tax Rates**: Standard VAT (10%), Reduced VAT (5%), Luxury Tax (15%)

### Product Data
- **18 Products**: Distributed across different brands and categories
  - Electronics: iPhones, Laptops, Headphones
  - Clothing: T-shirts, Jeans, Dresses, Jackets
  - Food & Beverages: Snacks, Drinks
  - Home & Garden: Coffee makers, Vacuum cleaners
  - Sports: Yoga mats, Dumbbells
- **54 Unit Prices**: Each product has pricing for all 3 channels
- **54 Stock Records**: Inventory tracking for each product-channel combination

### Customer & Supplier Data
- **30 Customers**: Mix of individual and business customers
  - Realistic names, emails, phone numbers
  - Balance and credit limits
  - Complete address information
- **4 Customer Groups**: VIP, Regular, Wholesale, New Customers
- **5 Suppliers**: With contact information and balance records

### Transaction Data
- **100 Sales Orders**: Spanning from Jan 2025 to Feb 2026
  - Multiple order types (retail, wholesale, online)
  - Various statuses (pending, processing, completed, cancelled)
  - Realistic pricing with taxes and discounts
- **Order Details**: 1-5 items per order with proper relationships
- **120 Payments**: Linked to orders and customers
  - Multiple payment types (cash, card, bank transfer, credit)
  - Different payment statuses

### System Data
- **4 Tenant Users**: Admin, Manager, Cashier, Sales Representative
- **7 Tags**: Product and customer tags for categorization
- **4 Settings**: Store info, branding, payment methods, tax defaults

## 🚀 How to Use

### Option 1: Direct PostgreSQL Import

```bash
# Connect to your database and run
psql -U your_username -d your_database -f mock-data.sql

# Or if you need to specify host and port
psql -h localhost -p 5432 -U your_username -d your_database -f mock-data.sql
```

### Option 2: Using pgAdmin or other GUI tools

1. Open your database client (pgAdmin, DBeaver, etc.)
2. Connect to your target database
3. Open and execute the `mock-data.sql` file

### Option 3: Docker PostgreSQL

If you're using Docker with the provided `docker-compose.yaml`:

```bash
# Copy the file into the container
docker cp mock-data.sql <container_name>:/tmp/

# Execute inside the container
docker exec -it <container_name> psql -U <username> -d <database> -f /tmp/mock-data.sql
```

## 🔄 Regenerating Mock Data

If you need to regenerate the mock data with different values:

```bash
# Run the generator script
npx tsx scripts/generate-mock-data.ts
```

This will create a new `mock-data.sql` file with fresh random data while maintaining all relationships.

## ⚠️ Important Notes

1. **Transaction Safety**: The SQL file uses `BEGIN` and `COMMIT` to ensure all data is inserted as a single transaction
2. **ID Management**: All records use explicit IDs to maintain referential integrity
3. **Foreign Keys**: Ensure your database schema has all necessary tables created before importing
4. **Timestamps**: All dates are in ISO 8601 format and range from 2024 to 2026
5. **Data Reset**: If you need to clean the data and start fresh, you'll need to truncate tables in the correct order (respecting foreign key constraints)

## 🧹 Cleaning Up Mock Data

To remove all mock data (be careful in production!):

```sql
BEGIN;

-- Delete in order to respect foreign key constraints
DELETE FROM sale_order_details;
DELETE FROM sale_orders;
DELETE FROM payments;
DELETE FROM customer_groups_customer;
DELETE FROM stocks;
DELETE FROM unit_prices;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM brands;
DELETE FROM customers;
DELETE FROM customer_groups;
DELETE FROM suppliers;
DELETE FROM tenant_users;
DELETE FROM channels;
DELETE FROM taxes;
DELETE FROM tags;
DELETE FROM settings;

COMMIT;
```

## 📈 Sample Queries to Explore the Data

### Get top selling products
```sql
SELECT p.name, p.sold_count, b.name as brand, c.name as category
FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN categories c ON p.main_category_id = c.id
ORDER BY p.sold_count DESC
LIMIT 10;
```

### Get customer orders with totals
```sql
SELECT c.name, COUNT(so.id) as order_count, SUM(so.total_price) as total_spent
FROM customers c
LEFT JOIN sale_orders so ON c.id = so.customer_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC;
```

### Check inventory levels
```sql
SELECT p.name, ch.name as channel, s.qty, p.sku
FROM stocks s
JOIN products p ON s.product_id = p.id
JOIN channels ch ON s.channel_id = ch.id
ORDER BY s.qty ASC;
```

### Get sales by date
```sql
SELECT DATE(order_date) as date, 
       COUNT(*) as orders, 
       SUM(total_price) as revenue
FROM sale_orders
WHERE status = 3  -- completed orders
GROUP BY DATE(order_date)
ORDER BY date DESC;
```

## 🎯 Use Cases

This mock data is perfect for:
- **Development**: Testing features without affecting production data
- **Demo**: Showcasing the POS system to stakeholders
- **Testing**: Running automated tests with realistic data
- **Training**: Teaching new team members how the system works
- **Performance Testing**: Benchmarking queries and operations

## 📝 Data Characteristics

- **Realistic**: Names, emails, phone numbers, and business details look genuine
- **Diverse**: Wide range of products, customers, and transaction scenarios
- **Temporal**: Data spans multiple months for time-based analysis
- **Relational**: All foreign key relationships are properly maintained
- **Random**: Each generation produces different values while maintaining structure

## 🛠️ Customization

To customize the mock data generation:

1. Edit `scripts/generate-mock-data.ts`
2. Modify the data arrays (brands, categories, customer names, etc.)
3. Adjust the quantity of records (products, customers, orders)
4. Change date ranges or value ranges
5. Run the generator script again

---

Generated by: `scripts/generate-mock-data.ts`
Last Updated: 2026-02-06
