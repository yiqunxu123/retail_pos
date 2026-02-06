/**
 * Analyze Mock Data
 * This script analyzes the generated mock data SQL file and provides statistics
 */

import * as fs from 'fs';
import * as path from 'path';

interface TableStats {
  name: string;
  count: number;
  samples: string[];
}

function analyzeMockData() {
  const sqlFilePath = path.join(__dirname, '..', 'powersync', 'mock-data.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
  
  console.log('🔍 Analyzing Mock Data SQL File...\n');
  console.log('═'.repeat(80));
  
  // Count INSERT statements by table
  const tables = [
    'brands', 'categories', 'channels', 'taxes', 'products',
    'unit_prices', 'stocks', 'customer_groups', 'customers',
    'customer_groups_customer', 'suppliers', 'tenant_users',
    'sale_orders', 'sale_order_details', 'payments', 'tags', 'settings'
  ];
  
  const stats: TableStats[] = [];
  
  tables.forEach(table => {
    const regex = new RegExp(`INSERT INTO ${table}`, 'g');
    const matches = sqlContent.match(regex);
    const count = matches ? matches.length : 0;
    
    // Extract sample data
    const sampleRegex = new RegExp(`INSERT INTO ${table}[^;]+;`, 'g');
    const sampleMatches = sqlContent.match(sampleRegex);
    const samples = sampleMatches ? sampleMatches.slice(0, 2) : [];
    
    stats.push({ name: table, count, samples });
  });
  
  // Display statistics
  console.log('\n📊 TABLE STATISTICS\n');
  console.log('─'.repeat(80));
  console.log(`${'Table Name'.padEnd(30)} | ${'Record Count'.padStart(12)}`);
  console.log('─'.repeat(80));
  
  let totalRecords = 0;
  stats.forEach(stat => {
    console.log(`${stat.name.padEnd(30)} | ${String(stat.count).padStart(12)}`);
    totalRecords += stat.count;
  });
  
  console.log('─'.repeat(80));
  console.log(`${'TOTAL'.padEnd(30)} | ${String(totalRecords).padStart(12)}`);
  console.log('═'.repeat(80));
  
  // Calculate file size
  const fileStats = fs.statSync(sqlFilePath);
  const fileSizeKB = (fileStats.size / 1024).toFixed(2);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  
  console.log('\n📁 FILE INFORMATION\n');
  console.log(`File Path: ${sqlFilePath}`);
  console.log(`File Size: ${fileSizeKB} KB (${fileSizeMB} MB)`);
  console.log(`Total Lines: ${sqlContent.split('\n').length.toLocaleString()}`);
  console.log(`Total Records: ${totalRecords.toLocaleString()}`);
  
  // Analyze data relationships
  console.log('\n🔗 DATA RELATIONSHIPS\n');
  console.log('─'.repeat(80));
  
  const relationships = [
    { from: 'Products', to: 'Brands', ratio: stats.find(s => s.name === 'products')!.count / stats.find(s => s.name === 'brands')!.count },
    { from: 'Products', to: 'Categories', ratio: stats.find(s => s.name === 'products')!.count / stats.find(s => s.name === 'categories')!.count },
    { from: 'Unit Prices', to: 'Products', ratio: stats.find(s => s.name === 'unit_prices')!.count / stats.find(s => s.name === 'products')!.count },
    { from: 'Stocks', to: 'Products', ratio: stats.find(s => s.name === 'stocks')!.count / stats.find(s => s.name === 'products')!.count },
    { from: 'Sale Orders', to: 'Customers', ratio: stats.find(s => s.name === 'sale_orders')!.count / stats.find(s => s.name === 'customers')!.count },
    { from: 'Order Details', to: 'Orders', ratio: stats.find(s => s.name === 'sale_order_details')!.count / stats.find(s => s.name === 'sale_orders')!.count },
  ];
  
  relationships.forEach(rel => {
    console.log(`${rel.from.padEnd(20)} → ${rel.to.padEnd(20)} | Ratio: ${rel.ratio.toFixed(2)}:1`);
  });
  
  // Data coverage analysis
  console.log('\n📈 DATA COVERAGE ANALYSIS\n');
  console.log('─'.repeat(80));
  
  const productsCount = stats.find(s => s.name === 'products')!.count;
  const channelsCount = stats.find(s => s.name === 'channels')!.count;
  const expectedPrices = productsCount * channelsCount;
  const actualPrices = stats.find(s => s.name === 'unit_prices')!.count;
  const pricesCoverage = (actualPrices / expectedPrices * 100).toFixed(1);
  
  console.log(`✓ Unit Prices Coverage: ${pricesCoverage}% (${actualPrices}/${expectedPrices})`);
  
  const expectedStocks = productsCount * channelsCount;
  const actualStocks = stats.find(s => s.name === 'stocks')!.count;
  const stocksCoverage = (actualStocks / expectedStocks * 100).toFixed(1);
  
  console.log(`✓ Stocks Coverage: ${stocksCoverage}% (${actualStocks}/${expectedStocks})`);
  
  const customersCount = stats.find(s => s.name === 'customers')!.count;
  const customerGroupAssignments = stats.find(s => s.name === 'customer_groups_customer')!.count;
  const groupCoverage = (customerGroupAssignments / customersCount * 100).toFixed(1);
  
  console.log(`✓ Customer Group Assignments: ${groupCoverage}% (${customerGroupAssignments}/${customersCount})`);
  
  // Business metrics
  console.log('\n💼 BUSINESS METRICS SIMULATION\n');
  console.log('─'.repeat(80));
  
  const ordersCount = stats.find(s => s.name === 'sale_orders')!.count;
  const orderDetailsCount = stats.find(s => s.name === 'sale_order_details')!.count;
  const paymentsCount = stats.find(s => s.name === 'payments')!.count;
  
  console.log(`Orders per Customer: ${(ordersCount / customersCount).toFixed(2)} average`);
  console.log(`Items per Order: ${(orderDetailsCount / ordersCount).toFixed(2)} average`);
  console.log(`Payment Records: ${paymentsCount} total`);
  console.log(`Order-to-Payment Ratio: ${(paymentsCount / ordersCount * 100).toFixed(1)}%`);
  
  // Sample data preview
  console.log('\n🎯 SAMPLE DATA PREVIEW\n');
  console.log('─'.repeat(80));
  
  // Show sample brand
  const brandSample = stats.find(s => s.name === 'brands')?.samples[0];
  if (brandSample) {
    const brandMatch = brandSample.match(/VALUES \((.+?)\);/);
    if (brandMatch) {
      console.log('Sample Brand:');
      console.log(`  ${brandSample.substring(0, 120)}...`);
    }
  }
  
  // Show sample product
  const productSample = stats.find(s => s.name === 'products')?.samples[0];
  if (productSample) {
    console.log('\nSample Product:');
    console.log(`  ${productSample.substring(0, 120)}...`);
  }
  
  // Show sample customer
  const customerSample = stats.find(s => s.name === 'customers')?.samples[0];
  if (customerSample) {
    console.log('\nSample Customer:');
    console.log(`  ${customerSample.substring(0, 120)}...`);
  }
  
  console.log('\n═'.repeat(80));
  console.log('\n✅ Analysis Complete!\n');
  console.log('📋 For more details, see: powersync/MOCK_DATA_README.md');
  console.log('🔄 To regenerate data: npx tsx scripts/generate-mock-data.ts\n');
}

// Run analysis
try {
  analyzeMockData();
} catch (error) {
  console.error('❌ Error analyzing mock data:', error);
  process.exit(1);
}
