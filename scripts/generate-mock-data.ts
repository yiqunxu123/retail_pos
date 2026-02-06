/**
 * Mock Data Generator for Retail POS System
 * Generates realistic test data with proper relationships
 */

import * as fs from 'fs';
import * as path from 'path';

// Helper function to generate random date
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

// Helper function to generate random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random float
function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Helper to escape SQL strings
function sqlEscape(str: string): string {
  return str.replace(/'/g, "''");
}

// Generate SQL INSERT statements
class MockDataGenerator {
  private sql: string[] = [];
  private startDate = new Date('2024-01-01');
  private endDate = new Date('2026-02-05');

  constructor() {
    this.sql.push('-- Mock Data for Retail POS System');
    this.sql.push('-- Generated on ' + new Date().toISOString());
    this.sql.push('');
    this.sql.push('BEGIN;');
    this.sql.push('');
  }

  // Generate Brands
  generateBrands() {
    this.sql.push('-- Insert Brands');
    const brands = [
      { id: 1, name: 'TechPro', slug: 'techpro', image: '/brands/techpro.png', is_featured: true },
      { id: 2, name: 'FashionHub', slug: 'fashionhub', image: '/brands/fashionhub.png', is_featured: true },
      { id: 3, name: 'FreshMart', slug: 'freshmart', image: '/brands/freshmart.png', is_featured: false },
      { id: 4, name: 'HomeStyle', slug: 'homestyle', image: '/brands/homestyle.png', is_featured: true },
      { id: 5, name: 'SportMax', slug: 'sportmax', image: '/brands/sportmax.png', is_featured: false },
    ];

    brands.forEach(brand => {
      const created_at = randomDate(this.startDate, new Date('2025-06-01'));
      this.sql.push(
        `INSERT INTO brands (id, name, slug, image, is_featured, created_at, updated_at) VALUES ` +
        `(${brand.id}, '${brand.name}', '${brand.slug}', '${brand.image}', ${brand.is_featured}, '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate Categories
  generateCategories() {
    this.sql.push('-- Insert Categories');
    const categories = [
      // Top level categories
      { id: 1, name: 'Electronics', code: 'ELEC', slug: 'electronics', is_featured: true, parent_id: null },
      { id: 2, name: 'Clothing', code: 'CLTH', slug: 'clothing', is_featured: true, parent_id: null },
      { id: 3, name: 'Food & Beverages', code: 'FOOD', slug: 'food-beverages', is_featured: false, parent_id: null },
      { id: 4, name: 'Home & Garden', code: 'HOME', slug: 'home-garden', is_featured: true, parent_id: null },
      { id: 5, name: 'Sports & Outdoors', code: 'SPRT', slug: 'sports-outdoors', is_featured: false, parent_id: null },
      
      // Sub-categories
      { id: 11, name: 'Smartphones', code: 'ELEC-PHN', slug: 'smartphones', is_featured: true, parent_id: 1 },
      { id: 12, name: 'Laptops', code: 'ELEC-LAP', slug: 'laptops', is_featured: true, parent_id: 1 },
      { id: 13, name: 'Headphones', code: 'ELEC-AUD', slug: 'headphones', is_featured: false, parent_id: 1 },
      
      { id: 21, name: 'Mens Wear', code: 'CLTH-MEN', slug: 'mens-wear', is_featured: true, parent_id: 2 },
      { id: 22, name: 'Womens Wear', code: 'CLTH-WMN', slug: 'womens-wear', is_featured: true, parent_id: 2 },
      
      { id: 31, name: 'Snacks', code: 'FOOD-SNK', slug: 'snacks', is_featured: false, parent_id: 3 },
      { id: 32, name: 'Beverages', code: 'FOOD-BEV', slug: 'beverages', is_featured: false, parent_id: 3 },
    ];

    categories.forEach(cat => {
      const created_at = randomDate(this.startDate, new Date('2025-06-01'));
      const parent = cat.parent_id ? cat.parent_id : 'NULL';
      this.sql.push(
        `INSERT INTO categories (id, name, code, slug, is_featured, image, parent_id, created_at, updated_at) VALUES ` +
        `(${cat.id}, '${sqlEscape(cat.name)}', '${cat.code}', '${cat.slug}', ${cat.is_featured}, '/categories/${cat.slug}.png', ${parent}, '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate Channels
  generateChannels() {
    this.sql.push('-- Insert Channels');
    const channels = [
      { id: 1, name: 'Main Store', description: 'Primary retail location', is_primary: true, type: 1 },
      { id: 2, name: 'Branch Store', description: 'Secondary location', is_primary: false, type: 1 },
      { id: 3, name: 'E-Commerce', description: 'Online sales channel', is_primary: false, type: 2 },
    ];

    channels.forEach(channel => {
      const created_at = randomDate(this.startDate, new Date('2025-01-01'));
      this.sql.push(
        `INSERT INTO channels (id, name, description, is_primary, type, created_at, updated_at) VALUES ` +
        `(${channel.id}, '${sqlEscape(channel.name)}', '${sqlEscape(channel.description)}', ${channel.is_primary}, ${channel.type}, '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate Taxes
  generateTaxes() {
    this.sql.push('-- Insert Taxes');
    const taxes = [
      { id: 1, name: 'Standard VAT', rate: 10.0, type: 'percentage', enabled: true },
      { id: 2, name: 'Reduced VAT', rate: 5.0, type: 'percentage', enabled: true },
      { id: 3, name: 'Luxury Tax', rate: 15.0, type: 'percentage', enabled: true },
    ];

    taxes.forEach(tax => {
      const created_at = randomDate(this.startDate, new Date('2025-01-01'));
      this.sql.push(
        `INSERT INTO taxes (id, name, rate, type, enabled, created_at, updated_at) VALUES ` +
        `(${tax.id}, '${sqlEscape(tax.name)}', ${tax.rate}, '${tax.type}', ${tax.enabled}, '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate Products
  generateProducts() {
    this.sql.push('-- Insert Products');
    
    const products = [
      // Electronics
      { brand_id: 1, name: 'iPhone 15 Pro', category_id: 11, weight: 187, weight_unit: 1, unit: 1, base_price: 999, cost: 750 },
      { brand_id: 1, name: 'Samsung Galaxy S24', category_id: 11, weight: 168, weight_unit: 1, unit: 1, base_price: 899, cost: 680 },
      { brand_id: 1, name: 'MacBook Pro 16"', category_id: 12, weight: 2100, weight_unit: 1, unit: 1, base_price: 2499, cost: 1850 },
      { brand_id: 1, name: 'Dell XPS 15', category_id: 12, weight: 1800, weight_unit: 1, unit: 1, base_price: 1799, cost: 1350 },
      { brand_id: 1, name: 'Sony WH-1000XM5', category_id: 13, weight: 250, weight_unit: 1, unit: 1, base_price: 399, cost: 280 },
      { brand_id: 1, name: 'AirPods Pro', category_id: 13, weight: 56, weight_unit: 1, unit: 1, base_price: 249, cost: 180 },
      
      // Clothing
      { brand_id: 2, name: 'Classic T-Shirt', category_id: 21, weight: 200, weight_unit: 1, unit: 1, base_price: 29.99, cost: 12 },
      { brand_id: 2, name: 'Denim Jeans', category_id: 21, weight: 600, weight_unit: 1, unit: 1, base_price: 79.99, cost: 35 },
      { brand_id: 2, name: 'Summer Dress', category_id: 22, weight: 300, weight_unit: 1, unit: 1, base_price: 89.99, cost: 40 },
      { brand_id: 2, name: 'Leather Jacket', category_id: 21, weight: 1200, weight_unit: 1, unit: 1, base_price: 299.99, cost: 150 },
      
      // Food & Beverages
      { brand_id: 3, name: 'Potato Chips 200g', category_id: 31, weight: 200, weight_unit: 1, unit: 1, base_price: 3.99, cost: 1.5 },
      { brand_id: 3, name: 'Chocolate Bar', category_id: 31, weight: 100, weight_unit: 1, unit: 1, base_price: 2.49, cost: 0.8 },
      { brand_id: 3, name: 'Energy Drink 500ml', category_id: 32, weight: 500, weight_unit: 2, unit: 2, base_price: 2.99, cost: 1.2 },
      { brand_id: 3, name: 'Mineral Water 1.5L', category_id: 32, weight: 1500, weight_unit: 2, unit: 2, base_price: 1.49, cost: 0.5 },
      
      // Home & Garden
      { brand_id: 4, name: 'Coffee Maker', category_id: 4, weight: 2500, weight_unit: 1, unit: 1, base_price: 89.99, cost: 45 },
      { brand_id: 4, name: 'Vacuum Cleaner', category_id: 4, weight: 5000, weight_unit: 1, unit: 1, base_price: 199.99, cost: 100 },
      
      // Sports
      { brand_id: 5, name: 'Yoga Mat', category_id: 5, weight: 1000, weight_unit: 1, unit: 1, base_price: 39.99, cost: 15 },
      { brand_id: 5, name: 'Dumbbells Set 10kg', category_id: 5, weight: 10000, weight_unit: 1, unit: 1, base_price: 79.99, cost: 35 },
    ];

    let productId = 1;
    products.forEach(product => {
      const created_at = randomDate(new Date('2025-01-01'), new Date('2025-12-01'));
      const sku = `SKU-${String(productId).padStart(6, '0')}`;
      const upc = `${randomInt(100000000000, 999999999999)}`;
      const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const sold_count = randomInt(0, 500);
      const is_featured = randomInt(0, 1) === 1;
      const is_online = true;
      const images = JSON.stringify([`/products/${slug}-1.jpg`, `/products/${slug}-2.jpg`]);
      
      this.sql.push(
        `INSERT INTO products (id, brand_id, name, weight, weight_unit, sku, upc, upc_2, upc_3, mlc, bin, description, is_online, status, unit_of_measurement, slug, sold_count, is_featured, main_category_id, images, created_at, updated_at) VALUES ` +
        `(${productId}, ${product.brand_id}, '${sqlEscape(product.name)}', ${product.weight}, ${product.weight_unit}, '${sku}', '${upc}', NULL, NULL, 'MLC${productId}', 'BIN${productId}', 'High quality ${sqlEscape(product.name.toLowerCase())}', ${is_online}, 1, ${product.unit}, '${slug}', ${sold_count}, ${is_featured}, ${product.category_id}, '${sqlEscape(images)}', '${created_at}', '${created_at}');`
      );
      productId++;
    });
    this.sql.push('');
  }

  // Generate Unit Prices and Stocks
  generateUnitPricesAndStocks() {
    this.sql.push('-- Insert Unit Prices');
    const totalProducts = 18;
    const channels = [1, 2, 3]; // Main Store, Branch, E-Commerce
    
    let unitPriceId = 1;
    for (let productId = 1; productId <= totalProducts; productId++) {
      channels.forEach(channelId => {
        const baseCost = randomFloat(10, 500, 2);
        const cost = baseCost;
        const base_cost = baseCost * 0.9;
        const price = baseCost * randomFloat(1.5, 2.5, 2);
        const ecom_price = price * (channelId === 3 ? 0.95 : 1); // 5% discount for e-commerce
        const created_at = randomDate(new Date('2025-01-01'), new Date('2025-12-01'));
        
        this.sql.push(
          `INSERT INTO unit_prices (id, product_id, channel_id, cost, price, base_cost, ecom_price, upc, unit, created_at, updated_at) VALUES ` +
          `(${unitPriceId}, ${productId}, ${channelId}, ${cost}, ${price}, ${base_cost}, ${ecom_price}, NULL, 1, '${created_at}', '${created_at}');`
        );
        unitPriceId++;
      });
    }
    this.sql.push('');

    // Generate Stocks
    this.sql.push('-- Insert Stocks');
    let stockId = 1;
    for (let productId = 1; productId <= totalProducts; productId++) {
      channels.forEach(channelId => {
        const qty = randomInt(10, 500);
        const created_at = randomDate(new Date('2025-01-01'), new Date('2026-02-01'));
        
        this.sql.push(
          `INSERT INTO stocks (id, channel_id, product_id, qty, status, created_at, updated_at) VALUES ` +
          `(${stockId}, ${channelId}, ${productId}, ${qty}, 1, '${created_at}', '${created_at}');`
        );
        stockId++;
      });
    }
    this.sql.push('');
  }

  // Generate Customer Groups
  generateCustomerGroups() {
    this.sql.push('-- Insert Customer Groups');
    const groups = [
      { id: 1, name: 'VIP Customers', is_active: true, tier_id: 3 },
      { id: 2, name: 'Regular Customers', is_active: true, tier_id: 2 },
      { id: 3, name: 'Wholesale Customers', is_active: true, tier_id: 4 },
      { id: 4, name: 'New Customers', is_active: true, tier_id: 1 },
    ];

    groups.forEach(group => {
      const created_at = randomDate(this.startDate, new Date('2025-01-01'));
      this.sql.push(
        `INSERT INTO customer_groups (id, name, is_active, tier_id, created_at, updated_at) VALUES ` +
        `(${group.id}, '${sqlEscape(group.name)}', ${group.is_active}, ${group.tier_id}, '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate Customers
  generateCustomers() {
    this.sql.push('-- Insert Customers');
    
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'William', 'Jennifer', 
                        'James', 'Mary', 'Richard', 'Patricia', 'Thomas', 'Linda', 'Charles', 'Barbara', 'Daniel', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                       'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'];

    for (let i = 1; i <= 30; i++) {
      const firstName = firstNames[randomInt(0, firstNames.length - 1)];
      const lastName = lastNames[randomInt(0, lastNames.length - 1)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
      const phone = `+1${randomInt(2000000000, 9999999999)}`;
      const balance = randomFloat(-5000, 10000, 2);
      const balance_limit = randomFloat(5000, 50000, 2);
      const city = cities[randomInt(0, cities.length - 1)];
      const state = states[randomInt(0, states.length - 1)];
      const businessName = i % 3 === 0 ? `${lastName} Enterprises` : null;
      const created_at = randomDate(new Date('2024-01-01'), new Date('2025-12-01'));
      
      this.sql.push(
        `INSERT INTO customers (id, no, name, email, balance, balance_limit, phone_no, business_name, business_city, business_state, business_country, business_zip_code, business_phone_no, address, status, allow_ecom, created_at, updated_at) VALUES ` +
        `(${i}, 'CUST${String(i).padStart(6, '0')}', '${name}', '${email}', ${balance}, ${balance_limit}, '${phone}', ${businessName ? `'${businessName}'` : 'NULL'}, '${city}', '${state}', 'USA', '${randomInt(10000, 99999)}', '${phone}', '${randomInt(100, 9999)} Main St, ${city}, ${state}', 1, '${i % 2 === 0 ? 'Y' : 'N'}', '${created_at}', '${created_at}');`
      );
    }
    this.sql.push('');

    // Assign customers to groups
    this.sql.push('-- Insert Customer Group Assignments');
    for (let customerId = 1; customerId <= 30; customerId++) {
      const groupId = customerId <= 5 ? 1 : customerId <= 15 ? 2 : customerId <= 22 ? 4 : 3;
      this.sql.push(
        `INSERT INTO customer_groups_customer (customer_group_id, customer_id) VALUES (${groupId}, ${customerId});`
      );
    }
    this.sql.push('');
  }

  // Generate Suppliers
  generateSuppliers() {
    this.sql.push('-- Insert Suppliers');
    const suppliers = [
      { name: 'Tech Wholesale Inc', email: 'sales@techwholesale.com', phone: '+12125551001', balance: -15000 },
      { name: 'Fashion Imports Ltd', email: 'orders@fashionimports.com', phone: '+13105552002', balance: -8500 },
      { name: 'Food Distributors Co', email: 'info@fooddist.com', phone: '+17135553003', balance: -3200 },
      { name: 'Home Goods Supply', email: 'contact@homegoods.com', phone: '+14805554004', balance: -12000 },
      { name: 'Sports Equipment Pro', email: 'sales@sportspro.com', phone: '+16465555005', balance: -6700 },
    ];

    suppliers.forEach((supplier, index) => {
      const created_at = randomDate(this.startDate, new Date('2025-01-01'));
      this.sql.push(
        `INSERT INTO suppliers (id, name, email, phone_no, balance, status, created_at, updated_at) VALUES ` +
        `(${index + 1}, '${supplier.name}', '${supplier.email}', '${supplier.phone}', ${supplier.balance}, 1, '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate Tenant Users
  generateTenantUsers() {
    this.sql.push('-- Insert Tenant Users');
    const users = [
      { first_name: 'Admin', last_name: 'User', username: 'admin', email: 'admin@retailpos.com', master_admin: true },
      { first_name: 'John', last_name: 'Manager', username: 'jmanager', email: 'john.manager@retailpos.com', master_admin: false },
      { first_name: 'Sarah', last_name: 'Cashier', username: 'scashier', email: 'sarah.cashier@retailpos.com', master_admin: false },
      { first_name: 'Mike', last_name: 'Sales', username: 'msales', email: 'mike.sales@retailpos.com', master_admin: false },
    ];

    users.forEach((user, index) => {
      const created_at = randomDate(this.startDate, new Date('2025-01-01'));
      const phone = `+1${randomInt(2000000000, 9999999999)}`;
      const assign_customer = index === 0;
      const view_all_customers = index <= 1;
      this.sql.push(
        `INSERT INTO tenant_users (id, first_name, last_name, username, email, phone_no, image, master_admin, status, assign_customer, view_all_customers, created_at, updated_at) VALUES ` +
        `(${index + 1}, '${sqlEscape(user.first_name)}', '${sqlEscape(user.last_name)}', '${user.username}', '${user.email}', '${phone}', '/avatars/${user.username}.png', ${user.master_admin}, 1, ${assign_customer}, ${view_all_customers}, '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate Sale Orders and Details
  generateSaleOrders() {
    this.sql.push('-- Insert Sale Orders and Order Details');
    
    const totalOrders = 100;
    let orderDetailId = 1;

    for (let orderId = 1; orderId <= totalOrders; orderId++) {
      const customerId = randomInt(1, 30);
      const orderType = randomInt(1, 3); // 1: retail, 2: wholesale, 3: online
      const saleType = 1; // Normal sale
      const status = randomInt(1, 4); // 1: pending, 2: processing, 3: completed, 4: cancelled
      const orderDate = randomDate(new Date('2025-01-01'), this.endDate);
      const created_at = orderDate;
      
      // Generate 1-5 items per order
      const itemCount = randomInt(1, 5);
      let totalPrice = 0;
      const orderDetails = [];
      
      for (let i = 0; i < itemCount; i++) {
        const productId = randomInt(1, 18);
        const channelId = orderType === 3 ? 3 : randomInt(1, 2);
        const unitPriceId = (productId - 1) * 3 + channelId;
        const qty = randomInt(1, 10);
        const price = randomFloat(10, 500, 2);
        const discount = randomFloat(0, price * 0.2, 2);
        const itemTotal = (price * qty) - discount;
        totalPrice += itemTotal;
        
        orderDetails.push({
          id: orderDetailId++,
          sale_order_id: orderId,
          product_id: productId,
          channel_id: channelId,
          unit_price_id: unitPriceId,
          qty,
          price,
          discount,
          total_price: itemTotal
        });
      }
      
      const tax = totalPrice * 0.1;
      const orderDiscount = randomFloat(0, totalPrice * 0.05, 2);
      const total_discount = orderDiscount;
      const delivery_charges = orderType === 3 ? randomFloat(5, 20, 2) : 0;
      const finalTotal = totalPrice + tax - total_discount + delivery_charges;
      
      this.sql.push(
        `INSERT INTO sale_orders (id, customer_id, no, order_type, sale_type, status, total_price, tax, discount, total_discount, delivery_charges, shipping_type, fulfilment_status, order_date, created_at, updated_at) VALUES ` +
        `(${orderId}, ${customerId}, 'ORD${String(orderId).padStart(8, '0')}', ${orderType}, ${saleType}, ${status}, ${finalTotal.toFixed(2)}, ${tax.toFixed(2)}, ${orderDiscount.toFixed(2)}, ${total_discount.toFixed(2)}, ${delivery_charges.toFixed(2)}, ${orderType}, ${status}, '${orderDate}', '${created_at}', '${created_at}');`
      );
      
      // Insert order details
      orderDetails.forEach(detail => {
        this.sql.push(
          `INSERT INTO sale_order_details (id, sale_order_id, product_id, channel_id, unit_price_id, qty, price, discount, total_price, created_at, updated_at) VALUES ` +
          `(${detail.id}, ${detail.sale_order_id}, ${detail.product_id}, ${detail.channel_id}, ${detail.unit_price_id}, ${detail.qty}, ${detail.price.toFixed(2)}, ${detail.discount.toFixed(2)}, ${detail.total_price.toFixed(2)}, '${created_at}', '${created_at}');`
        );
      });
    }
    this.sql.push('');
  }

  // Generate Payments
  generatePayments() {
    this.sql.push('-- Insert Payments');
    
    for (let i = 1; i <= 120; i++) {
      const customerId = randomInt(1, 30);
      const invoiceId = i <= 100 ? i : null; // Some payments linked to orders
      const status = randomInt(1, 3); // 1: pending, 2: completed, 3: failed
      const paymentType = randomInt(1, 4); // 1: cash, 2: card, 3: bank transfer, 4: credit
      const paymentDate = randomDate(new Date('2025-01-01'), this.endDate);
      const amount = randomFloat(10, 5000, 2);
      const category = randomInt(1, 3); // 1: sale, 2: refund, 3: credit
      const memo = i % 5 === 0 ? `Payment for order #${invoiceId || i}` : '';
      const created_at = paymentDate;
      
      this.sql.push(
        `INSERT INTO payments (id, customer_id, invoice_id, no, status, payment_type, payment_date, amount, category, memo, created_at, updated_at) VALUES ` +
        `(${i}, ${customerId}, ${invoiceId || 'NULL'}, 'PAY${String(i).padStart(8, '0')}', ${status}, ${paymentType}, '${paymentDate}', ${amount}, ${category}, '${sqlEscape(memo)}', '${created_at}', '${created_at}');`
      );
    }
    this.sql.push('');
  }

  // Generate Tags
  generateTags() {
    this.sql.push('-- Insert Tags');
    const tags = [
      { name: 'New Arrival', slug: 'new-arrival', type: 'product' },
      { name: 'Best Seller', slug: 'best-seller', type: 'product' },
      { name: 'Sale', slug: 'sale', type: 'product' },
      { name: 'Clearance', slug: 'clearance', type: 'product' },
      { name: 'Premium', slug: 'premium', type: 'product' },
      { name: 'VIP', slug: 'vip', type: 'customer' },
      { name: 'Wholesale', slug: 'wholesale', type: 'customer' },
    ];

    tags.forEach((tag, index) => {
      const created_at = randomDate(this.startDate, new Date('2025-01-01'));
      this.sql.push(
        `INSERT INTO tags (id, name, slug, type, created_at, updated_at) VALUES ` +
        `(${index + 1}, '${tag.name}', '${tag.slug}', '${tag.type}', '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate Settings
  generateSettings() {
    this.sql.push('-- Insert Settings');
    const settings = [
      { type: 'store', sub_type: 'info', value: JSON.stringify({ name: 'Retail POS Demo Store', address: '123 Main St, City, State 12345', phone: '+1234567890' }) },
      { type: 'store', sub_type: 'branding', value: JSON.stringify({ logo: '/logo.png', primary_color: '#4F46E5', secondary_color: '#10B981' }) },
      { type: 'payment', sub_type: 'methods', value: JSON.stringify({ cash: true, card: true, bank_transfer: true, credit: true }) },
      { type: 'tax', sub_type: 'default', value: JSON.stringify({ tax_id: 1, apply_on_all: true }) },
    ];

    settings.forEach((setting, index) => {
      const created_at = randomDate(this.startDate, new Date('2025-01-01'));
      this.sql.push(
        `INSERT INTO settings (id, type, sub_type, value, created_at, updated_at) VALUES ` +
        `(${index + 1}, '${setting.type}', '${setting.sub_type}', '${sqlEscape(setting.value)}', '${created_at}', '${created_at}');`
      );
    });
    this.sql.push('');
  }

  // Generate all data
  generate(): string {
    console.log('Generating mock data...');
    
    this.generateBrands();
    this.generateCategories();
    this.generateChannels();
    this.generateTaxes();
    this.generateProducts();
    this.generateUnitPricesAndStocks();
    this.generateCustomerGroups();
    this.generateCustomers();
    this.generateSuppliers();
    this.generateTenantUsers();
    this.generateSaleOrders();
    this.generatePayments();
    this.generateTags();
    this.generateSettings();
    
    this.sql.push('COMMIT;');
    this.sql.push('');
    this.sql.push('-- Mock data generation completed');
    this.sql.push(`-- Total statements: ${this.sql.length}`);
    
    return this.sql.join('\n');
  }
}

// Main execution
const generator = new MockDataGenerator();
const sqlContent = generator.generate();

// Write to file
const outputPath = path.join(__dirname, '..', 'powersync', 'mock-data.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf-8');

console.log('✅ Mock data SQL file generated successfully!');
console.log(`📁 File location: ${outputPath}`);
console.log('');
console.log('📊 Generated data summary:');
console.log('   - 5 Brands');
console.log('   - 12 Categories (with hierarchy)');
console.log('   - 3 Channels');
console.log('   - 3 Tax rates');
console.log('   - 18 Products');
console.log('   - 54 Unit prices (18 products × 3 channels)');
console.log('   - 54 Stock records');
console.log('   - 4 Customer groups');
console.log('   - 30 Customers');
console.log('   - 5 Suppliers');
console.log('   - 4 Tenant users');
console.log('   - 100 Sale orders with details');
console.log('   - 120 Payments');
console.log('   - 7 Tags');
console.log('   - 4 Settings');
console.log('');
console.log('🚀 To load the data:');
console.log('   1. Connect to your database');
console.log('   2. Run: psql -U your_user -d your_database -f powersync/mock-data.sql');
console.log('   or use your preferred database client to execute the SQL file');
