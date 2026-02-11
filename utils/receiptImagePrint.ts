/**
 * receiptImagePrint.ts
 *
 * Converts a base64-encoded PNG image into ESC/POS raster bitmap data
 * suitable for thermal printers, then sends via TCP to all enabled printers.
 *
 * Uses upng-js (pure JS, ~8 KB, no native deps) to decode PNG to RGBA pixels,
 * converts to 1-bit monochrome, wraps in GS v 0 raster command, and sends as
 * raw bytes over TCP.
 *
 * Flow: base64 PNG → decode pixels (upng-js) → 1-bit monochrome
 *       → GS v 0 raster command (Uint8Array) → TCP send (Buffer)
 */

import TcpSocket from 'react-native-tcp-socket';
import UPNG from 'upng-js';
import { ensurePrintersLoaded, getPrinters } from './PrinterPoolManager';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LUMINANCE_THRESHOLD = 128;

/** Image payloads are large – allow generous timeout */
const TCP_TIMEOUT = 8000;

const LOG_PREFIX = '🖼️ [ImagePrint]';
const log = {
  info: (msg: string, ...a: unknown[]) => console.log(`${LOG_PREFIX} ${msg}`, ...a),
  warn: (msg: string, ...a: unknown[]) => console.warn(`${LOG_PREFIX} ⚠️ ${msg}`, ...a),
  error: (msg: string, ...a: unknown[]) => console.error(`${LOG_PREFIX} ❌ ${msg}`, ...a),
  success: (msg: string, ...a: unknown[]) => console.log(`${LOG_PREFIX} ✅ ${msg}`, ...a),
};

// ---------------------------------------------------------------------------
// PNG → 1-bit monochrome → ESC/POS raster  (all Uint8Array, no strings)
// ---------------------------------------------------------------------------

/**
 * Decode a base64 (or data-uri) PNG into RGBA pixels.
 */
function decodePng(base64: string): { width: number; height: number; rgba: Uint8Array } {
  // Strip data-uri prefix if present
  const raw = base64.replace(/^data:image\/\w+;base64,/, '');

  // base64 → binary bytes
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const img = UPNG.decode(bytes.buffer);
  const frames = UPNG.toRGBA8(img);
  const rgba = new Uint8Array(frames[0]);
  return { width: img.width, height: img.height, rgba };
}

/**
 * Scale RGBA image to `targetWidth` using nearest-neighbour sampling.
 * Height scales proportionally. Returns original if already exact width.
 */
function scaleRgba(
  rgba: Uint8Array,
  srcW: number,
  srcH: number,
  targetWidth: number,
): { width: number; height: number; rgba: Uint8Array } {
  if (srcW === targetWidth) {
    return { width: srcW, height: srcH, rgba };
  }

  const scale = targetWidth / srcW;
  const dstW = targetWidth;
  const dstH = Math.round(srcH * scale);
  const out = new Uint8Array(dstW * dstH * 4);

  for (let y = 0; y < dstH; y++) {
    const srcY = Math.min(Math.floor(y / scale), srcH - 1);
    for (let x = 0; x < dstW; x++) {
      const srcX = Math.min(Math.floor(x / scale), srcW - 1);
      const srcOff = (srcY * srcW + srcX) * 4;
      const dstOff = (y * dstW + x) * 4;
      out[dstOff] = rgba[srcOff];
      out[dstOff + 1] = rgba[srcOff + 1];
      out[dstOff + 2] = rgba[srcOff + 2];
      out[dstOff + 3] = rgba[srcOff + 3];
    }
  }

  log.info(`Scaled ${srcW}×${srcH} → ${dstW}×${dstH}`);
  return { width: dstW, height: dstH, rgba: out };
}

/**
 * Convert RGBA pixels to a complete ESC/POS raster byte sequence.
 *
 * Layout:
 *   ESC @                         – initialise printer
 *   GS v 0  m  xL xH  yL yH     – raster header  (m=0 normal density)
 *   d1 … dk                      – 1-bit bitmap rows
 *   ESC d 4                      – feed 4 lines
 *   GS V 0                       – full cut
 *
 * Returns a Uint8Array so null bytes (0x00) are preserved perfectly.
 */
function rgbaToEscPosRaster(
  rgba: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const bytesPerRow = Math.ceil(width / 8);
  const bitmapSize = bytesPerRow * height;

  // Pre-allocate the full buffer:
  //   2 (ESC @) + 8 (GS v 0 header) + bitmap + 3 (feed) + 3 (cut)
  const total = 2 + 8 + bitmapSize + 3 + 3;
  const buf = new Uint8Array(total);
  let offset = 0;

  // ESC @ – initialise
  buf[offset++] = 0x1b;
  buf[offset++] = 0x40;

  // GS v 0  m  xL xH  yL yH
  buf[offset++] = 0x1d;
  buf[offset++] = 0x76;
  buf[offset++] = 0x30;
  buf[offset++] = 0x00; // m = normal
  buf[offset++] = bytesPerRow & 0xff;
  buf[offset++] = (bytesPerRow >> 8) & 0xff;
  buf[offset++] = height & 0xff;
  buf[offset++] = (height >> 8) & 0xff;

  // Bitmap data – 1 bit per pixel, 1 = black
  for (let y = 0; y < height; y++) {
    for (let byteIdx = 0; byteIdx < bytesPerRow; byteIdx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIdx * 8 + bit;
        if (x < width) {
          const px = (y * width + x) * 4;
          const r = rgba[px];
          const g = rgba[px + 1];
          const b = rgba[px + 2];
          const a = rgba[px + 3];
          // Transparent → white; otherwise weighted luminance
          const lum = a < 128 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < LUMINANCE_THRESHOLD) {
            byte |= 0x80 >> bit;
          }
        }
      }
      buf[offset++] = byte;
    }
  }

  // ESC d 4 – feed 4 lines
  buf[offset++] = 0x1b;
  buf[offset++] = 0x64;
  buf[offset++] = 0x04;

  // GS V 0 – full cut
  buf[offset++] = 0x1d;
  buf[offset++] = 0x56;
  buf[offset++] = 0x00;

  return buf;
}

// ---------------------------------------------------------------------------
// TCP send  – writes raw bytes (Buffer) so 0x00 is never lost
// ---------------------------------------------------------------------------

function sendViaTcp(
  ip: string,
  port: number,
  data: Uint8Array,
  name: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let client: ReturnType<typeof TcpSocket.createConnection> | null = null;
    let done = false;

    const finish = (success: boolean, error?: string) => {
      if (done) return;
      done = true;
      if (client) {
        try { client.end(); client.removeAllListeners(); client.destroy(); } catch { /* noop */ }
        client = null;
      }
      success ? resolve() : reject(new Error(error ?? 'Failed'));
    };

    const timer = setTimeout(() => finish(false, `Timeout (${TCP_TIMEOUT}ms)`), TCP_TIMEOUT);

    try {
      client = TcpSocket.createConnection({ host: ip, port }, () => {
        if (done) return;
        try {
          // Convert Uint8Array → binary string for react-native-tcp-socket
          // Using Array.from + join avoids O(n²) string concatenation
          const binaryStr = Array.from(data, b => String.fromCharCode(b)).join('');
          client!.write(binaryStr, 'binary', () => {
            clearTimeout(timer);
            log.success(`[${name}] ${data.byteLength} bytes sent to ${ip}:${port}`);
            finish(true);
          });
        } catch (e) {
          clearTimeout(timer);
          const msg = e instanceof Error ? e.message : String(e);
          log.error(`[${name}] Write exception: ${msg}`);
          finish(false, `Write failed: ${msg}`);
        }
      });

      client.on('error', (err: Error) => { clearTimeout(timer); finish(false, `Connect failed: ${err.message}`); });
      client.setTimeout(TCP_TIMEOUT);
      client.on('timeout', () => { clearTimeout(timer); finish(false, 'Socket timeout'); });
    } catch {
      clearTimeout(timer);
      finish(false, 'Create failed');
    }
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Print a base64 PNG receipt image to all enabled printers.
 * Accepts either a raw base64 string or a data-uri.
 *
 * @returns per-printer results so the caller can show appropriate feedback.
 */
export async function printImageToAll(base64Png: string): Promise<{
  success: boolean;
  results: Array<{ printer: string; success: boolean; error?: string }>;
}> {
  // 0. Ensure printer pool is populated (survives hot-reload)
  await ensurePrintersLoaded();

  // 1. Decode PNG → RGBA pixels
  log.info('Decoding PNG…');
  const decoded = decodePng(base64Png);
  log.info(`Decoded ${decoded.width}×${decoded.height} (${decoded.rgba.byteLength} bytes RGBA)`);

  // 2. Send to every enabled printer in parallel, scaling per-printer
  const enabledPrinters = getPrinters().filter(p => p.enabled && p.ip);

  if (enabledPrinters.length === 0) {
    log.error('No enabled printers with IP configured');
    return { success: false, results: [] };
  }

  log.info(`Sending to ${enabledPrinters.length} printer(s)…`);

  const tasks = enabledPrinters.map(printer => {
    const targetW = printer.printWidth || 576;
    // Scale image to match this printer's dot width
    const { width, height, rgba } = scaleRgba(decoded.rgba, decoded.width, decoded.height, targetW);
    const escPosData = rgbaToEscPosRaster(rgba, width, height);
    log.info(`[${printer.name}] Raster ${width}×${height} (${escPosData.byteLength} bytes) → ${printer.ip}:${printer.port || 9100}`);

    return sendViaTcp(printer.ip!, printer.port || 9100, escPosData, printer.name)
      .then(() => ({ printer: printer.name, success: true as const }))
      .catch(err => {
        const msg = err instanceof Error ? err.message : String(err);
        log.error(`[${printer.name}] ${printer.ip}:${printer.port || 9100} – ${msg}`);
        return {
          printer: printer.name,
          success: false as const,
          error: msg,
        };
      });
  });

  const results = await Promise.allSettled(tasks).then(settled =>
    settled.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { printer: enabledPrinters[i].name, success: false as const, error: String(r.reason) },
    ),
  );

  const successCount = results.filter(r => r.success).length;
  log.info(`Done – ${successCount}/${results.length} succeeded`);
  results.forEach(r => {
    if (r.success) {
      log.success(`  ${r.printer}: OK`);
    } else {
      log.error(`  ${r.printer}: ${r.error}`);
    }
  });
  return { success: successCount > 0, results };
}
