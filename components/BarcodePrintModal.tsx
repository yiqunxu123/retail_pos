import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TcpSocket from "react-native-tcp-socket";
import { ensurePrintersLoaded, getPrinters } from "../utils/PrinterPoolManager";
import { useProducts } from "../utils/powersync/hooks";
import type { ProductView } from "../utils/powersync/hooks/useProducts";

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  salePrice: number;
  quantity: number;
}

interface BarcodePrintModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems?: CartItem[];
}

interface LabelItem {
  product: ProductView;
  labelQty: number;
}

const ESC = "\x1b";
const GS = "\x1d";
const LF = "\n";

function buildBarcodeLabelEscPos(
  name: string,
  sku: string,
  upc: string,
  price: number,
): string {
  const barcodeData = upc || sku;
  if (!barcodeData) return "";

  const shortName = name.length > 30 ? name.slice(0, 28) + ".." : name;

  let cmd = "";
  cmd += `${ESC}@`;
  cmd += `${ESC}a\x01`;

  cmd += `${ESC}E\x01${ESC}!\x10`;
  cmd += shortName + LF;
  cmd += `${ESC}!\x00${ESC}E\x00`;

  if (sku) cmd += `SKU: ${sku}${LF}`;

  cmd += `${ESC}E\x01`;
  cmd += `$${price.toFixed(2)}${LF}`;
  cmd += `${ESC}E\x00`;
  cmd += LF;

  cmd += `${GS}h\x50`;
  cmd += `${GS}w\x02`;
  cmd += `${GS}H\x02`;
  cmd += `${GS}f\x00`;

  cmd += `${GS}k\x49${String.fromCharCode(barcodeData.length)}`;
  cmd += barcodeData;

  cmd += LF + LF;
  cmd += `${ESC}d\x03`;
  cmd += `${GS}V\x00`;

  return cmd;
}

function sendRawEscPos(
  ip: string,
  port: number,
  data: string,
  name: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let client: ReturnType<typeof TcpSocket.createConnection> | null = null;
    let done = false;

    const finish = (success: boolean, error?: string) => {
      if (done) return;
      done = true;
      if (client) {
        try { client.removeAllListeners(); client.destroy(); } catch {}
        client = null;
      }
      success ? resolve() : reject(new Error(error || "Failed"));
    };

    const timer = setTimeout(() => finish(false, "Timeout"), 3000);

    try {
      client = TcpSocket.createConnection({ host: ip, port }, () => {
        if (done) return;
        try {
          client!.write(data, "binary", () => {
            clearTimeout(timer);
            finish(true);
          });
        } catch {
          clearTimeout(timer);
          finish(false, "Write failed");
        }
      });
      client.on("error", () => { clearTimeout(timer); finish(false, "Connect failed"); });
      client.setTimeout(3000);
      client.on("timeout", () => { clearTimeout(timer); finish(false, "Socket timeout"); });
    } catch {
      clearTimeout(timer);
      finish(false, "Create failed");
    }
  });
}

const MODAL_HEIGHT = Math.round(Dimensions.get("window").height * 0.82);

export function BarcodePrintModal({ visible, onClose, cartItems }: BarcodePrintModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<LabelItem[]>([]);
  const [printing, setPrinting] = useState(false);
  const { products: allProducts, isLoading } = useProducts();

  // When modal opens with cart items, pre-populate from cart
  useEffect(() => {
    if (!visible || !cartItems || cartItems.length === 0 || allProducts.length === 0) return;

    const mapped: LabelItem[] = [];
    for (const ci of cartItems) {
      const full = allProducts.find((p) => p.id === ci.productId);
      if (full) {
        mapped.push({ product: full, labelQty: ci.quantity });
      }
    }
    if (mapped.length > 0) setItems(mapped);
  }, [visible, cartItems, allProducts]);

  const filteredProducts = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase();
    if (!kw) return allProducts.slice(0, 50);
    return allProducts.filter((p) => {
      const n = (p.name || "").toLowerCase();
      const s = (p.sku || "").toLowerCase();
      const u = (p.upc || "").toLowerCase();
      return n.includes(kw) || s.includes(kw) || u.includes(kw);
    });
  }, [allProducts, searchQuery]);

  const isSelected = useCallback(
    (id: string) => items.some((s) => s.product.id === id),
    [items],
  );

  const toggleProduct = useCallback((product: ProductView) => {
    setItems((prev) => {
      if (prev.some((s) => s.product.id === product.id)) {
        return prev.filter((s) => s.product.id !== product.id);
      }
      return [...prev, { product, labelQty: 1 }];
    });
  }, []);

  const updateLabelQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev.map((s) =>
        s.product.id === id ? { ...s, labelQty: Math.max(1, qty) } : s,
      ),
    );
  }, []);

  const totalLabels = useMemo(
    () => items.reduce((sum, s) => sum + s.labelQty, 0),
    [items],
  );

  const handlePrint = useCallback(async () => {
    if (items.length === 0) {
      Alert.alert("No Products", "Please select at least one product to print.");
      return;
    }

    setPrinting(true);
    try {
      await ensurePrintersLoaded();
      const enabledPrinters = getPrinters().filter((p) => p.enabled && p.ip);

      if (enabledPrinters.length === 0) {
        Alert.alert("No Printer", "No enabled printers found. Check printer settings.");
        return;
      }

      let allLabels = "";
      for (const item of items) {
        const { product, labelQty } = item;
        const labelCmd = buildBarcodeLabelEscPos(
          product.name, product.sku, product.upc, product.salePrice,
        );
        if (!labelCmd) {
          Alert.alert("Missing Barcode", `"${product.name}" has no UPC or SKU.`);
          continue;
        }
        for (let i = 0; i < labelQty; i++) allLabels += labelCmd;
      }

      if (!allLabels) {
        Alert.alert("Nothing to Print", "Selected products have no UPC/SKU data.");
        return;
      }

      const results = await Promise.allSettled(
        enabledPrinters.map((pr) =>
          sendRawEscPos(pr.ip!, pr.port || 9100, allLabels, pr.name),
        ),
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      if (ok > 0) {
        Alert.alert("Printed", `${totalLabels} label${totalLabels > 1 ? "s" : ""} sent to ${ok} printer${ok > 1 ? "s" : ""}.`);
      } else {
        Alert.alert("Print Failed", "Could not reach any printer.");
      }
    } catch (err: any) {
      Alert.alert("Print Error", err?.message || String(err));
    } finally {
      setPrinting(false);
    }
  }, [items, totalLabels]);

  const handleClose = useCallback(() => {
    setSearchQuery("");
    setItems([]);
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
        onPress={handleClose}
      >
        <Pressable
          style={{
            backgroundColor: "#FFF",
            borderRadius: 16,
            width: 720,
            height: MODAL_HEIGHT,
            overflow: "hidden",
          }}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 24, paddingVertical: 18,
            borderBottomWidth: 1, borderBottomColor: "#F0F1F4", backgroundColor: "#FAFAFA",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: "#EC1A52", alignItems: "center", justifyContent: "center",
              }}>
                <MaterialCommunityIcons name="barcode" size={24} color="#FFF" />
              </View>
              <View>
                <Text style={{ fontFamily: "Montserrat", fontSize: 20, fontWeight: "700", color: "#1A1A1A" }}>
                  Print Barcode Labels
                </Text>
                <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                  {cartItems && cartItems.length > 0
                    ? `${cartItems.length} cart product${cartItems.length > 1 ? "s" : ""} loaded · add more from database`
                    : "Select products and print barcode labels"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content: left search + right selected */}
          <View style={{ flexDirection: "row", flex: 1 }}>
            {/* Left: Product Search & List */}
            <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: "#F0F1F4" }}>
              <View style={{ padding: 16 }}>
                <View style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: "#F7F7F9", borderRadius: 10,
                  paddingHorizontal: 12, paddingVertical: 10,
                  borderWidth: 1, borderColor: "#E5E7EB",
                }}>
                  <Ionicons name="search" size={18} color="#9CA3AF" />
                  <TextInput
                    style={{ flex: 1, marginLeft: 8, fontFamily: "Montserrat", fontSize: 14, color: "#1A1A1A" }}
                    placeholder="Search by name, SKU, or UPC..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {isLoading ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <ActivityIndicator size="large" color="#EC1A52" />
                </View>
              ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
                  {filteredProducts.map((product) => {
                    const sel = isSelected(product.id);
                    return (
                      <TouchableOpacity
                        key={product.id}
                        onPress={() => toggleProduct(product)}
                        style={{
                          flexDirection: "row", alignItems: "center",
                          paddingHorizontal: 16, paddingVertical: 12,
                          backgroundColor: sel ? "#FEF2F2" : "#FFF",
                          borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
                        }}
                      >
                        <View style={{
                          width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                          borderColor: sel ? "#EC1A52" : "#D1D5DB",
                          backgroundColor: sel ? "#EC1A52" : "#FFF",
                          alignItems: "center", justifyContent: "center", marginRight: 12,
                        }}>
                          {sel && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: "#1A1A1A" }}
                            numberOfLines={1}
                          >
                            {product.name}
                          </Text>
                          <View style={{ flexDirection: "row", gap: 12, marginTop: 3 }}>
                            {product.sku ? (
                              <Text style={{ fontFamily: "Montserrat", fontSize: 11, color: "#6B7280" }}>
                                SKU: {product.sku}
                              </Text>
                            ) : null}
                            {product.upc ? (
                              <Text style={{ fontFamily: "Montserrat", fontSize: 11, color: "#6B7280" }}>
                                UPC: {product.upc}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "700", color: "#1A1A1A" }}>
                          ${product.salePrice.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Right: Selected Products & Quantities */}
            <View style={{ width: 280, backgroundColor: "#FAFAFA" }}>
              <View style={{
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
              }}>
                <Text style={{ fontFamily: "Montserrat", fontSize: 15, fontWeight: "700", color: "#1A1A1A" }}>
                  Labels to Print ({items.length})
                </Text>
              </View>

              {items.length === 0 ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
                  <MaterialCommunityIcons name="barcode-scan" size={48} color="#D1D5DB" />
                  <Text style={{
                    fontFamily: "Montserrat", fontSize: 13, color: "#9CA3AF",
                    textAlign: "center", marginTop: 12,
                  }}>
                    Select products from the list or they will be loaded from your cart
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 8 }}>
                  {items.map((item) => (
                    <View
                      key={item.product.id}
                      style={{
                        backgroundColor: "#FFF", borderRadius: 10, padding: 12,
                        borderWidth: 1, borderColor: "#E5E7EB",
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text
                          style={{ fontFamily: "Montserrat", fontSize: 13, fontWeight: "600", color: "#1A1A1A", flex: 1 }}
                          numberOfLines={2}
                        >
                          {item.product.name}
                        </Text>
                        <TouchableOpacity onPress={() => toggleProduct(item.product)} hitSlop={8} style={{ marginLeft: 8 }}>
                          <Ionicons name="close-circle" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                      </View>

                      <Text style={{ fontFamily: "Montserrat", fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                        {item.product.upc || item.product.sku || "No barcode data"}
                      </Text>
                      <Text style={{ fontFamily: "Montserrat", fontSize: 12, fontWeight: "700", color: "#1A1A1A", marginTop: 2 }}>
                        ${item.product.salePrice.toFixed(2)}
                      </Text>

                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 }}>
                        <Text style={{ fontFamily: "Montserrat", fontSize: 12, color: "#6B7280" }}>Qty:</Text>
                        <TouchableOpacity
                          onPress={() => updateLabelQty(item.product.id, item.labelQty - 1)}
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Ionicons name="remove" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <TextInput
                          style={{
                            width: 44, height: 28, borderRadius: 6,
                            borderWidth: 1, borderColor: "#E5E7EB",
                            textAlign: "center", fontFamily: "Montserrat",
                            fontSize: 13, fontWeight: "600", color: "#1A1A1A",
                            backgroundColor: "#FFF",
                          }}
                          keyboardType="numeric"
                          value={String(item.labelQty)}
                          onChangeText={(t) => updateLabelQty(item.product.id, parseInt(t) || 1)}
                        />
                        <TouchableOpacity
                          onPress={() => updateLabelQty(item.product.id, item.labelQty + 1)}
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Ionicons name="add" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 24, paddingVertical: 16,
            borderTopWidth: 1, borderTopColor: "#F0F1F4", backgroundColor: "#FAFAFA",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="printer-outline" size={18} color="#6B7280" />
              <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#6B7280" }}>
                {totalLabels} label{totalLabels !== 1 ? "s" : ""} to print
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              {items.length > 0 && (
                <TouchableOpacity
                  onPress={() => setItems([])}
                  style={{
                    paddingHorizontal: 20, paddingVertical: 10,
                    borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB",
                    backgroundColor: "#FFF",
                  }}
                >
                  <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: "#6B7280" }}>
                    Clear All
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handlePrint}
                disabled={printing || items.length === 0}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 8,
                  paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10,
                  backgroundColor: printing || items.length === 0 ? "#D1D5DB" : "#EC1A52",
                }}
              >
                {printing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="print" size={18} color="#FFF" />
                )}
                <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "700", color: "#FFF" }}>
                  {printing ? "Printing..." : "Print Labels"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
