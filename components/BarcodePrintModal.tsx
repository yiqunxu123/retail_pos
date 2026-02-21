import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TcpSocket from "react-native-tcp-socket";
import { useRenderTrace } from "../utils/debug/useRenderTrace";
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
  products?: ProductView[];
  productsLoading?: boolean;
}

interface LabelItem {
  product: ProductView;
  labelQty: number;
}

interface BarcodePrintModalCoreProps extends BarcodePrintModalProps {
  allProducts: ProductView[];
  isLoading: boolean;
}

interface BarcodePrintPanelContentProps {
  cartItems?: CartItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onClearSearch: () => void;
  filteredProducts: ProductView[];
  isSelected: (id: string) => boolean;
  onToggleProduct: (product: ProductView) => void;
  items: LabelItem[];
  onUpdateLabelQty: (id: string, qty: number) => void;
  totalLabels: number;
  printing: boolean;
  onPrint: () => void;
  onClearItems: () => void;
  onClose: () => void;
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
        try {
          client.removeAllListeners();
          client.destroy();
        } catch {}
        client = null;
      }
      if (success) {
        resolve();
      } else {
        reject(new Error(error || "Failed"));
      }
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
      client.on("error", () => {
        clearTimeout(timer);
        finish(false, "Connect failed");
      });
      client.setTimeout(3000);
      client.on("timeout", () => {
        clearTimeout(timer);
        finish(false, "Socket timeout");
      });
    } catch {
      clearTimeout(timer);
      finish(false, "Create failed");
    }
  });
}

const BarcodePrintPanelContent = React.memo(function BarcodePrintPanelContent({
  cartItems,
  isLoading,
  searchQuery,
  onSearchQueryChange,
  onClearSearch,
  filteredProducts,
  isSelected,
  onToggleProduct,
  items,
  onUpdateLabelQty,
  totalLabels,
  printing,
  onPrint,
  onClearItems,
  onClose,
}: BarcodePrintPanelContentProps) {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderBottomColor: "#F0F1F4",
          backgroundColor: "#FAFAFA",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#EC1A52",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name="barcode" size={24} color="#FFF" />
          </View>
          <View>
            <Text
              style={{
                fontFamily: "Montserrat",
                fontSize: 20,
                fontWeight: "700",
                color: "#1A1A1A",
              }}
            >
              Print Barcode Labels
            </Text>
            <Text
              style={{
                fontFamily: "Montserrat",
                fontSize: 13,
                color: "#9CA3AF",
                marginTop: 2,
              }}
            >
              {cartItems && cartItems.length > 0
                ? `${cartItems.length} cart product${cartItems.length > 1 ? "s" : ""} loaded - add more from database`
                : "Select products and print barcode labels"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", flex: 1 }}>
        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: "#F0F1F4" }}>
          <View style={{ padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F7F7F9",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontFamily: "Montserrat",
                  fontSize: 14,
                  color: "#1A1A1A",
                }}
                placeholder="Search by name, SKU, or UPC..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={onSearchQueryChange}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={onClearSearch}>
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
                const selected = isSelected(product.id);
                return (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => onToggleProduct(product)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: selected ? "#FEF2F2" : "#FFF",
                      borderBottomWidth: 1,
                      borderBottomColor: "#F3F4F6",
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: selected ? "#EC1A52" : "#D1D5DB",
                        backgroundColor: selected ? "#EC1A52" : "#FFF",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "Montserrat",
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#1A1A1A",
                        }}
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

        <View style={{ width: 280, backgroundColor: "#FAFAFA" }}>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#E5E7EB",
            }}
          >
            <Text style={{ fontFamily: "Montserrat", fontSize: 15, fontWeight: "700", color: "#1A1A1A" }}>
              Labels to Print ({items.length})
            </Text>
          </View>

          {items.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
              <MaterialCommunityIcons name="barcode-scan" size={48} color="#D1D5DB" />
              <Text
                style={{
                  fontFamily: "Montserrat",
                  fontSize: 13,
                  color: "#9CA3AF",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                Select products from the list or they will be loaded from your cart
              </Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 8 }}>
              {items.map((item) => (
                <View
                  key={item.product.id}
                  style={{
                    backgroundColor: "#FFF",
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text
                      style={{
                        fontFamily: "Montserrat",
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#1A1A1A",
                        flex: 1,
                      }}
                      numberOfLines={2}
                    >
                      {item.product.name}
                    </Text>
                    <TouchableOpacity onPress={() => onToggleProduct(item.product)} hitSlop={8} style={{ marginLeft: 8 }}>
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
                      onPress={() => onUpdateLabelQty(item.product.id, item.labelQty - 1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="remove" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <TextInput
                      style={{
                        width: 44,
                        height: 28,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        textAlign: "center",
                        fontFamily: "Montserrat",
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#1A1A1A",
                        backgroundColor: "#FFF",
                      }}
                      keyboardType="numeric"
                      value={String(item.labelQty)}
                      onChangeText={(t) => onUpdateLabelQty(item.product.id, parseInt(t, 10) || 1)}
                    />
                    <TouchableOpacity
                      onPress={() => onUpdateLabelQty(item.product.id, item.labelQty + 1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
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

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: "#F0F1F4",
          backgroundColor: "#FAFAFA",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons name="printer-outline" size={18} color="#6B7280" />
          <Text style={{ fontFamily: "Montserrat", fontSize: 13, color: "#6B7280" }}>
            {totalLabels} label{totalLabels !== 1 ? "s" : ""} to print
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {items.length > 0 && (
            <TouchableOpacity
              onPress={onClearItems}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#FFF",
              }}
            >
              <Text style={{ fontFamily: "Montserrat", fontSize: 14, fontWeight: "600", color: "#6B7280" }}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onPrint}
            disabled={printing || items.length === 0}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: 10,
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
    </>
  );
});
BarcodePrintPanelContent.displayName = "BarcodePrintPanelContent";

function BarcodePrintModalCore({
  visible,
  onClose,
  cartItems,
  allProducts,
  isLoading,
}: BarcodePrintModalCoreProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const modalHeight = useMemo(() => Math.round(height * 0.82), [height]);
  const safeAreaPadding = useMemo(
    () => ({
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }),
    [insets.bottom, insets.left, insets.right, insets.top]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<LabelItem[]>([]);
  const [printing, setPrinting] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, ProductView>();
    allProducts.forEach((product) => map.set(product.id, product));
    return map;
  }, [allProducts]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleClearItems = useCallback(() => {
    setItems([]);
  }, []);

  useEffect(() => {
    if (
      !visible ||
      items.length > 0 ||
      !cartItems ||
      cartItems.length === 0 ||
      allProducts.length === 0
    ) {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      const mapped: LabelItem[] = [];
      for (const ci of cartItems) {
        const full = productById.get(ci.productId);
        if (full) {
          mapped.push({ product: full, labelQty: ci.quantity });
        }
      }
      if (mapped.length > 0) {
        setItems((prev) => (prev.length === 0 ? mapped : prev));
      }
    });

    return () => {
      task.cancel();
    };
  }, [visible, items.length, cartItems, allProducts.length, productById]);

  const filteredProducts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return allProducts.slice(0, 50);

    return allProducts.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const sku = (product.sku || "").toLowerCase();
      const upc = (product.upc || "").toLowerCase();
      return name.includes(keyword) || sku.includes(keyword) || upc.includes(keyword);
    });
  }, [allProducts, searchQuery]);

  const selectedProductIdSet = useMemo(
    () => new Set(items.map((item) => item.product.id)),
    [items]
  );

  const isSelected = useCallback(
    (id: string) => selectedProductIdSet.has(id),
    [selectedProductIdSet]
  );

  const toggleProduct = useCallback((product: ProductView) => {
    setItems((prev) => {
      if (prev.some((entry) => entry.product.id === product.id)) {
        return prev.filter((entry) => entry.product.id !== product.id);
      }
      return [...prev, { product, labelQty: 1 }];
    });
  }, []);

  const updateLabelQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev.map((entry) =>
        entry.product.id === id ? { ...entry, labelQty: Math.max(1, qty) } : entry,
      ),
    );
  }, []);

  const totalLabels = useMemo(
    () => items.reduce((sum, entry) => sum + entry.labelQty, 0),
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
      const enabledPrinters = getPrinters().filter((printer) => printer.enabled && printer.ip);

      if (enabledPrinters.length === 0) {
        Alert.alert(
          "No Printer Configured",
          "No enabled network printers found.\n\nPlease go to Settings and add a printer with:\n- Printer Name\n- IP Address (e.g., 192.168.1.100)\n- Port (usually 9100)",
        );
        setPrinting(false);
        return;
      }

      let allLabels = "";
      for (const item of items) {
        const { product, labelQty } = item;
        const labelCmd = buildBarcodeLabelEscPos(
          product.name,
          product.sku,
          product.upc,
          product.salePrice,
        );

        if (!labelCmd) {
          Alert.alert("Missing Barcode", `"${product.name}" has no UPC or SKU.`);
          continue;
        }

        for (let i = 0; i < labelQty; i += 1) {
          allLabels += labelCmd;
        }
      }

      if (!allLabels) {
        Alert.alert("Nothing to Print", "Selected products have no UPC/SKU data.");
        return;
      }

      const results = await Promise.allSettled(
        enabledPrinters.map((printer) =>
          sendRawEscPos(printer.ip!, printer.port || 9100, allLabels, printer.name),
        ),
      );

      const ok = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.filter((result) => result.status === "rejected");

      if (ok > 0) {
        Alert.alert(
          "Printed",
          `${totalLabels} label${totalLabels > 1 ? "s" : ""} sent to ${ok} printer${ok > 1 ? "s" : ""}.`,
        );
      } else {
        const errors = failed
          .map((result: any) => result.reason?.message || "Unknown error")
          .join("\n");

        Alert.alert(
          "Print Failed",
          `Could not reach any printer.\n\nCommon issues:\n- Printer is offline or turned off\n- Wrong IP address in Settings\n- Printer not on same network\n- Port blocked by firewall\n\nErrors: ${errors}`,
        );
      }
    } catch (error: any) {
      Alert.alert("Print Error", error?.message || String(error));
    } finally {
      setPrinting(false);
    }
  }, [items, totalLabels]);

  const handleClose = useCallback(() => {
    handleClearSearch();
    handleClearItems();
    onClose();
  }, [handleClearItems, handleClearSearch, onClose]);

  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose();
      return true;
    });

    return () => subscription.remove();
  }, [handleClose, visible]);

  useRenderTrace(
    "BarcodePrintModal",
    {
      visible,
      searchQuery,
      itemsLength: items.length,
      filteredProductsLength: filteredProducts.length,
      allProductsLength: allProducts.length,
      cartItemsLength: cartItems?.length ?? 0,
      isLoading,
      printing,
      onClose,
    },
    { throttleMs: 100 },
  );

  return (
    <View pointerEvents="box-none" style={styles.rootContainer}>
      <View pointerEvents="none" style={[styles.backdrop, { opacity: visible ? 0.5 : 0 }]} />
      <View pointerEvents={visible ? "auto" : "none"} style={[styles.touchGate, safeAreaPadding]}>
        <Pressable style={styles.backdropOverlay} onPress={handleClose} />
        <Pressable
          style={[
            styles.panel,
            {
              width: 720,
              height: modalHeight,
              transform: [{ translateY: visible ? 0 : height }],
            },
          ]}
          onPress={() => {}}
        >
          <BarcodePrintPanelContent
            cartItems={cartItems}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onClearSearch={handleClearSearch}
            filteredProducts={filteredProducts}
            isSelected={isSelected}
            onToggleProduct={toggleProduct}
            items={items}
            onUpdateLabelQty={updateLabelQty}
            totalLabels={totalLabels}
            printing={printing}
            onPrint={handlePrint}
            onClearItems={handleClearItems}
            onClose={handleClose}
          />
        </Pressable>
      </View>
    </View>
  );
}

function BarcodePrintModalWithData(props: BarcodePrintModalProps) {
  const { products: allProducts, isLoading } = useProducts();
  return <BarcodePrintModalCore {...props} allProducts={allProducts} isLoading={isLoading} />;
}

export function BarcodePrintModal(props: BarcodePrintModalProps) {
  if (props.products) {
    return (
      <BarcodePrintModalCore
        {...props}
        allProducts={props.products}
        isLoading={props.productsLoading ?? false}
      />
    );
  }

  return <BarcodePrintModalWithData {...props} />;
}

const styles = StyleSheet.create({
  rootContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1100,
    elevation: 1100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  touchGate: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    zIndex: 2,
    elevation: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
});
