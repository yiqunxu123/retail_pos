declare module "qrcode/lib/core/qrcode" {
  interface BitMatrix {
    size: number;
    data: Uint8Array;
    get(row: number, col: number): number;
  }

  interface QRCodeResult {
    modules: BitMatrix;
    version: number;
    errorCorrectionLevel: { bit: number };
  }

  function create(
    data: string,
    options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H" },
  ): QRCodeResult;

  export { BitMatrix, QRCodeResult, create };
}
