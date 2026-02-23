/**
 * Barcode label printing (dev test) - Direct ESC/POS print to network printers
 * Prints barcodes for products in shopping cart.
 */

import TcpSocket from "react-native-tcp-socket";
import { Alert } from "react-native";
import { ensurePrintersLoaded, getPrinters } from "./PrinterPoolManager";
import type { ProductView } from "./powersync/hooks";

export interface CartItemForBarcode {
  productId: string;
  name: string;
  sku: string;
  salePrice: number;
  quantity: number;
}

const ESC = "\x1b";
const GS = "\x1d";
const LF = "\n";

function buildBarcodeLabelEscPos(
  name: string,
  sku: string,
  upc: string,
  price: number
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
  data: string
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

/**
 * Print barcode labels for cart items directly to configured network printers.
 * Dev test function - one-click print of shopping cart products.
 */
export async function printBarcodeLabelsForCart(
  cartItems: CartItemForBarcode[],
  allProducts: ProductView[]
): Promise<void> {
  if (cartItems.length === 0) {
    Alert.alert("Empty Cart", "Add products to cart first to print barcodes.");
    return;
  }

  const productById = new Map<string, ProductView>();
  allProducts.forEach((p) => productById.set(p.id, p));

  const items: { product: ProductView; qty: number }[] = [];
  for (const ci of cartItems) {
    const full = productById.get(ci.productId);
    if (full) {
      items.push({ product: full, qty: ci.quantity });
    }
  }

  if (items.length === 0) {
    Alert.alert("No Products", "Could not resolve cart products. Try refreshing.");
    return;
  }

  try {
    await ensurePrintersLoaded();
    const enabledPrinters = getPrinters().filter((p) => p.enabled && p.ip);

    if (enabledPrinters.length === 0) {
      Alert.alert(
        "No Printer Configured",
        "No enabled network printers found.\n\nPlease go to Settings and add a printer with IP and Port (usually 9100)."
      );
      return;
    }

    let allLabels = "";
    let totalLabels = 0;

    for (const { product, qty } of items) {
      const labelCmd = buildBarcodeLabelEscPos(
        product.name,
        product.sku ?? "",
        product.upc ?? "",
        product.salePrice
      );

      if (!labelCmd) {
        Alert.alert("Missing Barcode", `"${product.name}" has no UPC or SKU.`);
        continue;
      }

      for (let i = 0; i < qty; i++) {
        allLabels += labelCmd;
        totalLabels++;
      }
    }

    if (!allLabels) {
      Alert.alert("Nothing to Print", "Selected products have no UPC/SKU data.");
      return;
    }

    const results = await Promise.allSettled(
      enabledPrinters.map((printer) =>
        sendRawEscPos(printer.ip!, printer.port || 9100, allLabels)
      )
    );

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");

    if (ok > 0) {
      Alert.alert(
        "Printed",
        `${totalLabels} label${totalLabels > 1 ? "s" : ""} sent to ${ok} printer${ok > 1 ? "s" : ""}.`
      );
    } else {
      const errors = failed
        .map((r: any) => (r as PromiseRejectedResult).reason?.message || "Unknown")
        .join("\n");
      Alert.alert(
        "Print Failed",
        `Could not reach any printer.\n\nErrors: ${errors}`
      );
    }
  } catch (error: any) {
    Alert.alert("Print Error", error?.message || String(error));
  }
}
