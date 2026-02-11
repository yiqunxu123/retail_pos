/**
 * Receipt Text Formatter
 * Generates text-based receipt format with ESC/POS markup tags
 * for character-based thermal printing
 */

import { ReceiptData } from "../components/ReceiptTemplate";

/**
 * Format receipt data as text with ESC/POS markup
 * Supports tags: <C>, <L>, <R>, <B>, </B>, <CB>, </CB>, <CD>, </CD>
 */
export const formatReceiptText = (data: ReceiptData): string => {
  const lines: string[] = [];

  // Header - Store name (centered, bold, large)
  lines.push('<CB>RETAIL POS</CB>');
  lines.push('<C>--------------------------------</C>');

  // Order info
  lines.push(`<L>Order: ${data.orderNo}</L>`);
  lines.push(`<L>Date: ${data.dateTime}</L>`);
  lines.push('<C>--------------------------------</C>');

  // Items header
  lines.push('<L>Item                Qty   Price</L>');
  lines.push('<C>--------------------------------</C>');

  // Items
  data.items.forEach(item => {
    const name = item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name;
    const qty = String(item.qty).padStart(3);
    const price = `$${item.totalPrice.toFixed(2)}`.padStart(8);
    lines.push(`<L>${name.padEnd(20)}${qty} ${price}</L>`);
  });

  lines.push('<C>--------------------------------</C>');

  // Totals
  const subtotalStr = `$${data.subtotal.toFixed(2)}`.padStart(10);
  lines.push(`<L>Subtotal:${subtotalStr.padStart(22)}</L>`);

  if (data.discount > 0) {
    const discountStr = `-$${data.discount.toFixed(2)}`.padStart(10);
    lines.push(`<L>Discount:${discountStr.padStart(22)}</L>`);
  }

  const taxLabel = data.taxLabel || `$${data.tax.toFixed(2)}`;
  const taxStr = data.taxLabel ? taxLabel.padStart(10) : taxLabel.padStart(10);
  lines.push(`<L>Tax:${taxStr.padStart(27)}</L>`);

  lines.push('<C>--------------------------------</C>');

  const totalStr = `$${data.total.toFixed(2)}`.padStart(10);
  lines.push(`<CB>TOTAL:${totalStr.padStart(24)}</CB>`);

  lines.push('<C>--------------------------------</C>');
  lines.push('<C>Thank you for your business!</C>');
  lines.push('<C>Please come again</C>');
  lines.push('');
  lines.push('');
  lines.push('');

  return lines.join('\n');
};
