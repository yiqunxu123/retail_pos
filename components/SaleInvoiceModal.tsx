import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colors } from '@/utils/theme';
import type { SaleOrderEntity } from "../utils/api/orders";
import {
    InvoiceStatus,
    PaymentType,
    SaleOrderStatus,
} from "../utils/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SaleInvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called when user taps "New Order" */
  onNewOrder: () => void;
  /** Called when user taps "Print Receipt" */
  onPrint?: () => void;
  /** The full sale order entity from the API */
  order: SaleOrderEntity | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "$0.00";
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mi}:${ss}`;
  } catch {
    return "-";
  }
}

function getInvoiceStatusLabel(status?: number): string {
  if (status == null) return "-";
  const labels: Record<number, string> = {
    [InvoiceStatus.DUE]: "Due",
    [InvoiceStatus.UN_PAID]: "Unpaid",
    [InvoiceStatus.PAID]: "Paid",
    [InvoiceStatus.OVER_PAID]: "Over Paid",
    [InvoiceStatus.PARTIALLY_PAID]: "Partially Paid",
    [InvoiceStatus.FULLY_REFUNDED]: "Fully Refunded",
    [InvoiceStatus.PARTIALLY_REFUNDED]: "Partially Refunded",
    [InvoiceStatus.VOID]: "Void",
  };
  return labels[status] || "-";
}

function getPaymentTypeLabel(type?: number): string {
  if (type == null) return "-";
  const labels: Record<number, string> = {
    [PaymentType.CASH]: "Cash",
    [PaymentType.CHEQUE]: "Cheque",
    [PaymentType.CREDIT_DEBIT_GATEWAY]: "Credit/Debit Card",
    [PaymentType.CASH_ON_DELIVERY]: "Cash on Delivery",
    [PaymentType.WIRE_TRANSFER]: "Wire Transfer",
    [PaymentType.ON_ACCOUNT]: "On Account",
    [PaymentType.MONEY_ORDER]: "Money Order",
    [PaymentType.CUSTOMER_USE_CREDIT]: "Customer Credit Used",
    [PaymentType.CUSTOMER_ADD_CREDIT]: "Customer Credit Added",
    [PaymentType.GRAIL_PAY]: "GrailPay",
    [PaymentType.CREDIT_DEBIT_TERMINAL]: "Credit/Debit Terminal",
  };
  return labels[type] || "-";
}

function getOrderTypeLabel(type?: number): string {
  const labels: Record<number, string> = { 0: "Walk-in", 1: "Online", 2: "Phone", 3: "Other" };
  return labels[type ?? 0] || "-";
}

const UNIT_LABELS: Record<number, string> = { 1: "Piece", 2: "Pack", 3: "Case", 4: "Pallet" };

function getUnitLabel(unit?: number): string {
  if (unit == null) return "-";
  return UNIT_LABELS[unit] || "-";
}

// Stamp color
function getStampStyle(order: SaleOrderEntity) {
  if (order.status === SaleOrderStatus.VOID) return { color: colors.error, label: "VOID" };
  if (order.invoice?.status === InvoiceStatus.PAID) return { color: colors.success, label: "PAID" };
  if (order.invoice?.status === InvoiceStatus.PARTIALLY_PAID) return { color: colors.warning, label: "PARTIAL" };
  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text style={{ width: 90, fontSize: 14, color: colors.textSecondary, fontWeight: '600' }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 14, color: colors.textDark }}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
      <Text style={{ fontSize: 14, color: bold ? colors.textDark : colors.textSecondary, fontWeight: bold ? '700' : '400' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: bold ? colors.textDark : colors.textMedium, fontWeight: bold ? '700' : '500' }}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SaleInvoiceModal({
  visible,
  onClose,
  onNewOrder,
  onPrint,
  order,
}: SaleInvoiceModalProps) {
  if (!order) return null;

  const details = order.sale_order_details || [];
  const invoice = order.invoice;
  const customer = order.customer;
  const stamp = getStampStyle(order);

  // Totals
  const totalProducts = details.length;
  const totalQuantity = details.reduce((sum, d) => sum + (d.qty ?? 0), 0);
  const subTotal = invoice?.sub_total ?? details.reduce((sum, d) => sum + d.total_price, 0);
  const taxAmount = order.tax_amount ?? order.tax ?? 0;
  const totalDiscount = invoice?.total_discount ?? order.total_discount ?? 0;
  const deliveryCharges = order.delivery_charges ?? 0;
  const invoiceTotal = invoice?.total_amount ?? order.total_price ?? 0;
  const paidAmount = invoice?.paid_amount ?? 0;
  const invoiceBalance = invoice?.remaining_amount ?? 0;

  // Payments
  const payments = invoice?.payments?.filter((p) => ![5, 6, 8].includes(p.status)) ?? [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            width: "92%",
            height: "90%",
            overflow: "hidden",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* ────────── Header ────────── */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.backgroundLight,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primary} />
              <Text className="text-lg font-bold" style={{ color: colors.textDark }}>Sale Invoice</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* ────────── Body ────────── */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18 }}>

            {/* Stamp Watermark */}
            {stamp && (
              <View style={{ position: "absolute", top: 40, right: 30, zIndex: 10, opacity: 0.13, transform: [{ rotate: "-15deg" }] }}>
                <Text className="text-5xl font-bold" style={{ color: stamp.color, letterSpacing: 6 }}>
                  {stamp.label}
                </Text>
              </View>
            )}

            {/* ── Order Info (3 columns) ── */}
            <View style={{ flexDirection: "row", marginBottom: 14 }}>
              {/* Col 1 */}
              <View style={{ flex: 1 }}>
                <InfoRow label="SO#:" value={order.no || "-"} />
                <InfoRow label="Cus No:" value={customer?.no || "-"} />
                <InfoRow label="Order Type:" value={getOrderTypeLabel(order.order_type)} />
              </View>
              {/* Col 2 */}
              <View style={{ flex: 1 }}>
                <InfoRow label="Time:" value={formatTime(order.created_at)} />
                <InfoRow label="Inv Due Dt:" value={formatDate(invoice?.due_date)} />
                <InfoRow
                  label="Created by:"
                  value={
                    order.created_by
                      ? `${order.created_by.first_name} ${order.created_by.last_name}`
                      : "-"
                  }
                />
              </View>
              {/* Col 3 */}
              <View style={{ flex: 1 }}>
                <InfoRow label="Order Date:" value={formatDate(order.order_date)} />
                <InfoRow label="Inv Status:" value={getInvoiceStatusLabel(invoice?.status)} />
                <InfoRow
                  label="Sales Rep.:"
                  value={order.sale_agent?.username || "-"}
                />
              </View>
            </View>

            {/* ── Bill To ── */}
            {customer && (
              <View
                style={{
                  marginBottom: 14,
                  padding: 10,
                  backgroundColor: colors.backgroundLight,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textTertiary, marginBottom: 4, letterSpacing: 0.5 }}>
                  BILL TO
                </Text>
                <InfoRow label="Business:" value={customer.business_name || "-"} />
                <InfoRow
                  label="Customer:"
                  value={customer.customer_billing_details?.name || "-"}
                />
                <InfoRow label="Email:" value={customer.email || "-"} />
                <InfoRow
                  label="Phone:"
                  value={customer.business_phone_no || customer.customer_billing_details?.telephone_num || "-"}
                />
                {customer.customer_billing_details?.address ? (
                  <InfoRow label="Address:" value={customer.customer_billing_details.address} />
                ) : null}
              </View>
            )}

            {/* ── Product Table ── */}
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              {/* Table Header */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: colors.backgroundSecondary,
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ width: 24, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>Sr.</Text>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>Name</Text>
                <Text style={{ width: 32, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: "center" }}>Qty</Text>
                <Text style={{ width: 68, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>SKU</Text>
                <Text style={{ width: 72, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>UPC Number</Text>
                <Text style={{ width: 42, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>Unit</Text>
                <Text style={{ width: 55, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: "right" }}>Price</Text>
                <Text style={{ width: 55, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: "right" }}>MSRP</Text>
                <Text style={{ width: 42, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: "right" }}>Disc.</Text>
                <Text style={{ width: 38, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: "right" }}>Tax</Text>
                <Text style={{ width: 58, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: "right" }}>Total</Text>
              </View>

              {/* Table Body */}
              {details.map((item, idx) => {
                const product = item.product;
                const productName = product?.name || item.name || "-";
                const sku = product?.sku || item.sku || "-";
                const upc = product?.upc || item.upc || "-";
                const unitPrice = item.unit_price ?? item.price ?? 0;
                const msrp = product?.msrp_price ?? item.msrp_price ?? 0;
                const discountVal = item.discount ?? 0;
                const discountStr =
                  item.discount_type === 2
                    ? `${discountVal}%`
                    : formatCurrency(discountVal);
                const total = item.total_price ?? unitPrice * item.qty;
                const category = product?.main_category?.name;

                // Per-line tax
                const lineTaxes = item.sale_order_detail_taxes || item.tax_values || [];
                const lineTaxAmount = item.tax_amount ?? lineTaxes.reduce((s, t) => s + (t.amount ?? 0), 0);

                return (
                  <View key={item.id || idx}>
                    {/* Product Row */}
                    <View
                      style={{
                        flexDirection: "row",
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                        backgroundColor: idx % 2 === 0 ? "#fff" : colors.backgroundLight,
                        borderTopWidth: idx === 0 ? 0 : 0.5,
                        borderTopColor: colors.border,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ width: 24, fontSize: 14, color: colors.textSecondary }}>{idx + 1}</Text>
                      <View style={{ flex: 1, paddingRight: 4 }}>
                        <Text style={{ fontSize: 14, color: colors.textDark, fontWeight: '500' }} numberOfLines={2}>
                          {productName}
                        </Text>
                      </View>
                      <Text style={{ width: 32, fontSize: 14, color: colors.textDark, textAlign: "center" }}>
                        {Math.floor(item.qty)}
                      </Text>
                      <Text style={{ width: 68, fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>
                        {sku}
                      </Text>
                      <Text style={{ width: 72, fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>
                        {upc}
                      </Text>
                      <Text style={{ width: 42, fontSize: 14, color: colors.textSecondary }}>
                        {getUnitLabel(item.unit)}
                      </Text>
                      <Text style={{ width: 55, fontSize: 14, color: colors.textDark, textAlign: "right" }}>
                        {formatCurrency(unitPrice)}
                      </Text>
                      <Text style={{ width: 55, fontSize: 14, color: colors.textSecondary, textAlign: "right" }}>
                        {msrp > 0 ? formatCurrency(msrp) : "-"}
                      </Text>
                      <Text style={{ width: 42, fontSize: 14, color: colors.textSecondary, textAlign: "right" }}>
                        {discountVal > 0 ? discountStr : "$0"}
                      </Text>
                      <Text style={{ width: 38, fontSize: 14, color: colors.textSecondary, textAlign: "right" }}>
                        {lineTaxAmount > 0 ? formatCurrency(lineTaxAmount) : "$0"}
                      </Text>
                      <Text style={{ width: 58, fontSize: 14, color: colors.textDark, fontWeight: '600', textAlign: "right" }}>
                        {formatCurrency(total)}
                      </Text>
                    </View>

                    {/* Category sub-row */}
                    {category ? (
                      <View style={{
                        paddingLeft: 32,
                        paddingBottom: 4,
                        paddingTop: 0,
                        backgroundColor: idx % 2 === 0 ? "#fff" : colors.backgroundLight,
                      }}>
                        <Text style={{ fontSize: 14, color: colors.textTertiary, fontStyle: "italic" }}>{category}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}

              {/* Table Footer — Qty & Total summary row */}
              {details.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    paddingVertical: 7,
                    paddingHorizontal: 8,
                    backgroundColor: colors.backgroundSecondary,
                    borderTopWidth: 1,
                    borderTopColor: colors.borderMedium,
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMedium, marginRight: 12 }}>
                    Qty: {totalQuantity}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMedium }}>
                    Total: {formatCurrency(subTotal)}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Payment Details ── */}
            {payments.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMedium, marginBottom: 6 }}>
                  Payment Details
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {/* Payment Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: colors.backgroundSecondary,
                      paddingVertical: 7,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text style={{ width: 24, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>#</Text>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>Payment Type</Text>
                    <Text style={{ width: 70, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>Ref No.</Text>
                    <Text style={{ width: 65, fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>Date</Text>
                    <Text style={{ width: 70, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: "right" }}>Amount</Text>
                  </View>
                  {payments.map((p, idx) => (
                    <View
                      key={p.id || idx}
                      style={{
                        flexDirection: "row",
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        backgroundColor: idx % 2 === 0 ? "#fff" : colors.backgroundLight,
                        borderTopWidth: 0.5,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Text style={{ width: 24, fontSize: 14, color: colors.textSecondary }}>{idx + 1}</Text>
                      <Text style={{ flex: 1, fontSize: 14, color: colors.textDark }}>
                        {getPaymentTypeLabel(p.payment_type)}
                      </Text>
                      <Text style={{ width: 70, fontSize: 14, color: colors.textSecondary }}>
                        {p.reference_number || "-"}
                      </Text>
                      <Text style={{ width: 65, fontSize: 14, color: colors.textSecondary }}>
                        {formatDate(p.payment_date)}
                      </Text>
                      <Text style={{ width: 70, fontSize: 14, color: colors.textDark, fontWeight: '600', textAlign: "right" }}>
                        {formatCurrency(p.paid_amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Tax Breakdown ── */}
            {((order.sale_order_level_taxes?.length ?? 0) > 0 ||
              (order.sale_order_li_total_taxes?.length ?? 0) > 0) && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMedium, marginBottom: 4 }}>Taxes</Text>
                {order.sale_order_level_taxes?.map((t, i) => (
                  <SummaryRow key={`solt-${i}`} label={t.tax.name} value={formatCurrency(t.amount)} />
                ))}
                {order.sale_order_li_total_taxes?.map((t, i) => (
                  <SummaryRow key={`litt-${i}`} label={t.tax.name} value={formatCurrency(t.amount)} />
                ))}
              </View>
            )}

            {/* ── Totals Summary ── */}
            <View
              style={{
                backgroundColor: colors.backgroundLight,
                padding: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <SummaryRow label="Total Products" value={String(totalProducts)} />
              <SummaryRow label="Total Quantity" value={String(totalQuantity)} />
              <SummaryRow label="Sub Total" value={formatCurrency(subTotal)} />
              {totalDiscount > 0 && (
                <SummaryRow label="Discount Amount" value={formatCurrency(totalDiscount)} />
              )}
              {order.discount > 0 && (
                <SummaryRow
                  label="Additional Discount"
                  value={
                    order.discount_type === 2
                      ? `${order.discount}%`
                      : formatCurrency(order.discount)
                  }
                />
              )}
              {taxAmount > 0 && <SummaryRow label="Tax" value={formatCurrency(taxAmount)} />}
              {deliveryCharges > 0 && (
                <SummaryRow label="Delivery Charges" value={formatCurrency(deliveryCharges)} />
              )}
              <View style={{ borderTopWidth: 1, borderTopColor: colors.borderMedium, marginVertical: 6 }} />
              <SummaryRow label="Invoice Total" value={formatCurrency(invoiceTotal)} bold />
              <SummaryRow label="Paid Amount" value={formatCurrency(paidAmount)} />
              <SummaryRow label="Invoice Balance" value={formatCurrency(invoiceBalance)} bold />

              {order.pre_order_customer_balance != null && (
                <SummaryRow
                  label="Prev. Customer Balance"
                  value={formatCurrency(order.pre_order_customer_balance)}
                />
              )}
              {order.post_order_customer_balance != null && (
                <SummaryRow
                  label="Total Customer Balance"
                  value={formatCurrency(order.post_order_customer_balance)}
                />
              )}
              {customer?.balance != null && (
                <SummaryRow
                  label="Current Customer Balance"
                  value={formatCurrency(customer.balance)}
                />
              )}
            </View>

            {/* ── Powered By ── */}
            <View style={{ marginTop: 14, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 14, color: colors.textTertiary }}>Powered by Kommerce Hub.</Text>
            </View>

          </ScrollView>

          {/* ────────── Footer Actions ────────── */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.backgroundLight,
            }}
          >
            {onPrint && (
              <TouchableOpacity
                onPress={onPrint}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Ionicons name="print-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Print Receipt</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onNewOrder}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: colors.primary,
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: '600', fontSize: 14 }}>New Order</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
