/**
 * Print Queue System
 * Manages print jobs sequentially to prevent printer connection issues
 */

type PrintJob = {
  id: string;
  type: 'ethernet' | 'usb' | 'bluetooth';
  data: string;
  timestamp: number;
};

type PrinterConfig = {
  ip?: string;
  port?: number;
  vendorId?: number;
  productId?: number;
  macAddress?: string;
};

// Dynamic import for thermal printer
let NetPrinter: any = null;
let USBPrinter: any = null;
let BLEPrinter: any = null;
try {
  const printer = require("react-native-thermal-receipt-printer");
  NetPrinter = printer.NetPrinter;
  USBPrinter = printer.USBPrinter;
  BLEPrinter = printer.BLEPrinter;
} catch (e) {
  console.log("Thermal printer not available");
}

class PrintQueueManager {
  private queue: PrintJob[] = [];
  private isProcessing: boolean = false;
  private config: PrinterConfig = {
    ip: "192.168.1.100",
    port: 9100,
  };
  private listeners: ((status: string, job?: PrintJob) => void)[] = [];

  // Set printer configuration
  setConfig(config: Partial<PrinterConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Check if printer type is available
  isPrinterAvailable(type: 'ethernet' | 'usb' | 'bluetooth'): boolean {
    switch (type) {
      case 'ethernet':
        return !!NetPrinter;
      case 'usb':
        return !!USBPrinter;
      case 'bluetooth':
        return !!BLEPrinter;
      default:
        return false;
    }
  }

  // Check if any printer is available
  isAnyPrinterAvailable(): boolean {
    return !!NetPrinter || !!USBPrinter || !!BLEPrinter;
  }

  // Add listener for queue status updates
  addListener(callback: (status: string, job?: PrintJob) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(status: string, job?: PrintJob) {
    this.listeners.forEach(l => l(status, job));
  }

  // Add a print job to the queue
  addJob(type: 'ethernet' | 'usb' | 'bluetooth', data: string): string {
    // Check if printer type is available
    if (!this.isPrinterAvailable(type)) {
      console.error(`[PrintQueue] ${type} printer not available`);
      throw new Error(`${type} printer not available. Make sure you're running a development build.`);
    }

    const job: PrintJob = {
      id: `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
    };

    this.queue.push(job);
    this.notify('queued', job);
    console.log(`[PrintQueue] Job added: ${job.id}, Queue length: ${this.queue.length}`);

    // Start processing if not already
    if (!this.isProcessing) {
      this.processNext();
    }

    return job.id;
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      pendingJobs: this.queue.map(j => ({ id: j.id, type: j.type })),
    };
  }

  // Clear all pending jobs
  clearQueue() {
    const cleared = this.queue.length;
    this.queue = [];
    this.notify('cleared');
    console.log(`[PrintQueue] Cleared ${cleared} jobs`);
  }

  // Process the next job in queue
  private async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.notify('idle');
      console.log('[PrintQueue] Queue empty, idle');
      return;
    }

    this.isProcessing = true;
    const job = this.queue[0];
    this.notify('processing', job);
    console.log(`[PrintQueue] Processing job: ${job.id}`);

    try {
      await this.executeJob(job);
      this.notify('completed', job);
      console.log(`[PrintQueue] Job completed: ${job.id}`);
    } catch (error) {
      console.error(`[PrintQueue] Job failed: ${job.id}`, error);
      this.notify('failed', job);
    }

    // Remove completed/failed job
    this.queue.shift();

    // Small delay between jobs to let printer reset
    await this.delay(300);

    // Process next job
    this.processNext();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calculate print time based on content length
  private calculatePrintTime(data: string): number {
    const lines = data.split('\n').length;
    // Approximately 50ms per line, minimum 500ms, maximum 5000ms
    return Math.min(Math.max(lines * 50, 500), 5000);
  }

  // Execute a single print job
  private async executeJob(job: PrintJob): Promise<void> {
    const printTime = this.calculatePrintTime(job.data);
    const timeout = printTime + 3000; // Add 3 seconds buffer

    return new Promise(async (resolve, reject) => {
      // Set timeout for the entire operation
      const timeoutId = setTimeout(() => {
        console.error(`[PrintQueue] Job timeout: ${job.id}`);
        reject(new Error('Print timeout'));
      }, timeout);

      try {
        switch (job.type) {
          case 'ethernet':
            await this.printEthernet(job.data, printTime);
            break;
          case 'usb':
            await this.printUSB(job.data, printTime);
            break;
          case 'bluetooth':
            await this.printBluetooth(job.data, printTime);
            break;
        }
        clearTimeout(timeoutId);
        resolve();
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Print via Ethernet
  private async printEthernet(data: string, waitTime: number): Promise<void> {
    if (!NetPrinter) throw new Error('NetPrinter not available');

    try {
      // Close any existing connection
      try {
        if (NetPrinter.closeConn) {
          await NetPrinter.closeConn();
        }
      } catch (e) {
        // Ignore
      }

      await NetPrinter.init();
      await NetPrinter.connectPrinter(this.config.ip, this.config.port);
      await NetPrinter.printBill(data);

      // Wait for print to complete
      await this.delay(waitTime);
    } finally {
      // Always close connection
      try {
        if (NetPrinter.closeConn) {
          await NetPrinter.closeConn();
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // Print via USB
  private async printUSB(data: string, waitTime: number): Promise<void> {
    if (!USBPrinter) throw new Error('USBPrinter not available');

    try {
      // Close any existing connection
      try {
        if (USBPrinter.closeConn) {
          await USBPrinter.closeConn();
        }
      } catch (e) {
        // Ignore
      }

      await USBPrinter.init();
      const devices = await USBPrinter.getDeviceList();

      if (!devices || devices.length === 0) {
        throw new Error('No USB printer found');
      }

      const printer = this.config.vendorId && this.config.productId
        ? devices.find((d: any) => d.vendor_id === this.config.vendorId && d.product_id === this.config.productId)
        : devices[0];

      if (!printer) {
        throw new Error('Specified USB printer not found');
      }

      await USBPrinter.connectPrinter(printer.vendor_id, printer.product_id);
      await USBPrinter.printBill(data);

      // Wait for print to complete
      await this.delay(waitTime);
    } finally {
      // Always close connection
      try {
        if (USBPrinter.closeConn) {
          await USBPrinter.closeConn();
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // Print via Bluetooth
  private async printBluetooth(data: string, waitTime: number): Promise<void> {
    if (!BLEPrinter) throw new Error('BLEPrinter not available');

    try {
      await BLEPrinter.init();
      const devices = await BLEPrinter.getDeviceList();

      if (!devices || devices.length === 0) {
        throw new Error('No Bluetooth printer found');
      }

      const printer = this.config.macAddress
        ? devices.find((d: any) => d.inner_mac_address === this.config.macAddress)
        : devices[0];

      if (!printer) {
        throw new Error('Specified Bluetooth printer not found');
      }

      await BLEPrinter.connectPrinter(printer.inner_mac_address || printer.device_name);
      await BLEPrinter.printBill(data);

      // Wait for print to complete
      await this.delay(waitTime);
    } catch (e) {
      throw e;
    }
  }
}

// Singleton instance
export const printQueue = new PrintQueueManager();

// Helper function to add print job
export const addPrintJob = (
  type: 'ethernet' | 'usb' | 'bluetooth',
  data: string
): string => {
  return printQueue.addJob(type, data);
};

// Helper function to get queue status
export const getPrintQueueStatus = () => {
  return printQueue.getStatus();
};

// Helper function to clear queue
export const clearPrintQueue = () => {
  printQueue.clearQueue();
};

// Helper function to set printer config
export const setPrinterConfig = (config: Partial<PrinterConfig>) => {
  printQueue.setConfig(config);
};

// Helper function to check if printer is available
export const isPrinterAvailable = (type: 'ethernet' | 'usb' | 'bluetooth'): boolean => {
  return printQueue.isPrinterAvailable(type);
};

// Helper function to check if any printer is available
export const isAnyPrinterAvailable = (): boolean => {
  return printQueue.isAnyPrinterAvailable();
};

export default printQueue;
