/**
 * Receipt Text Formatter
 * Generates text-based receipt format with ESC/POS markup tags
 * for character-based thermal printing
 */

import { ReceiptData } from "../components/ReceiptTemplate";

/**
 * Calculate character width based on printer dot width
 * 58mm (384 dots) ≈ 32 chars, 80mm (576 dots) ≈ 48 chars
 */
const getCharWidth = (printWidth: number): number => {
  if (printWidth <= 384) return 32;  // 58mm
  if (printWidth <= 576) return 48;  // 80mm
  return 48; // default to 48 for larger widths
};

/**
 * Format receipt data as text with ESC/POS markup
 * Supports tags: <C>, <L>, <R>, <B>, </B>, <CB>, </CB>, <CD>, </CD>
 * @param data Receipt data
 * @param printWidth Printer width in dots (384 for 58mm, 576 for 80mm)
 */
export const formatReceiptText = (data: ReceiptData, printWidth: number = 576): string => {
  const charWidth = getCharWidth(printWidth);
  const lines: string[] = [];
  const separator = '-'.repeat(charWidth);

  // Dashed line
  lines.push('<C>' + separator + '</C>');

  // Header - Order No and DateTime on same line
  const orderNoStr = data.orderNo;
  const dateTimeStr = data.dateTime;
  const headerSpacing = charWidth - orderNoStr.length - dateTimeStr.length;
  lines.push(`<L>${orderNoStr}${' '.repeat(Math.max(1, headerSpacing))}${dateTimeStr}</L>`);

  // Order info (mirrors SaleInvoiceModal header)
  if (data.createdBy) lines.push(`<L>Created by: ${data.createdBy}</L>`);

  // Bill To (mirrors SaleInvoiceModal customer block)
  if (data.customerName || data.customerContact || data.customerEmail || data.customerPhone || data.customerAddress) {
    lines.push('<L>' + separator + '</L>');
    if (data.customerName) lines.push(`<L>Customer: ${data.customerName}</L>`);
    if (data.customerContact) lines.push(`<L>Contact: ${data.customerContact}</L>`);
    if (data.customerEmail) lines.push(`<L>Email: ${data.customerEmail}</L>`);
    if (data.customerPhone) lines.push(`<L>Phone: ${data.customerPhone}</L>`);
    if (data.customerAddress) lines.push(`<L>Address: ${data.customerAddress}</L>`);
  }

  // Solid line
  lines.push('<L>' + separator + '</L>');

  // Items - format: "qty x name" on left, price on right
  data.items.forEach(item => {
    const qtyName = `${item.qty} x ${item.name}`;
    const priceStr = `$${item.totalPrice.toFixed(2)}`;

    // Calculate available space for item name
    const maxNameWidth = charWidth - priceStr.length - 1;
    const displayName = qtyName.length > maxNameWidth
      ? qtyName.substring(0, maxNameWidth - 3) + '...'
      : qtyName;

    const spacing = charWidth - displayName.length - priceStr.length;
    lines.push(`<L>${displayName}${' '.repeat(Math.max(1, spacing))}${priceStr}</L>`);
  });

  // Solid line
  lines.push('<L>' + separator + '</L>');

  // Totals - right-aligned values
  const formatTotalLine = (label: string, value: string) => {
    const spacing = charWidth - label.length - value.length;
    return `<L>${label}${' '.repeat(Math.max(1, spacing))}${value}</L>`;
  };

  lines.push(formatTotalLine('Subtotal:', `$${data.subtotal.toFixed(2)}`));

  if (data.discountAmount > 0) {
    lines.push(formatTotalLine('Discount Amount:', `$${data.discountAmount.toFixed(2)}`));
  }
  if (data.additionalDiscount > 0) {
    const adVal = data.additionalDiscountType === 2
      ? `${parseFloat(data.additionalDiscount.toFixed(2))}%`
      : `$${data.additionalDiscount.toFixed(2)}`;
    lines.push(formatTotalLine('Additional Discount:', adVal));
  }

  const taxLabel = data.taxLabel || '0%';
  lines.push(formatTotalLine(`Tax(${taxLabel}):`, `$${data.tax.toFixed(2)}`));

  // Bold total line
  lines.push('<B>' + formatTotalLine('Total:', `$${data.total.toFixed(2)}`) + '</B>');

  // QR code placeholder (order number centered)
  lines.push('');
  lines.push(`<C>${data.orderNo}</C>`);
  lines.push('');

  // Bottom padding
  lines.push('');
  lines.push('');

  return lines.join('\n');
};
