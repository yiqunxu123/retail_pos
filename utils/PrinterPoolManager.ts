/**
 * Printer Pool Manager
 * Single printer pool management system - Multi-printer load balancing
 */

import TcpSocket from "react-native-tcp-socket";
import {
    BLEPrinter,
    NetPrinter,
    USBPrinter,
} from "react-native-thermal-receipt-printer";

// ============ Mutex for Printer Access ============
// NetPrinter is singleton, needs mutex to prevent concurrent access
class PrinterMutex {
  private locked = false;
  private waiting: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    
    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }
}

const printerMutex = new PrinterMutex();

// ============ Types ============

export type PrinterType = 'ethernet' | 'usb' | 'bluetooth';

export type PrinterStatus = 'idle' | 'busy' | 'offline' | 'error';

export interface PrinterConfig {
  id: string;
  name: string;
  type: PrinterType;
  ip?: string;
  port?: number;
  vendorId?: number;
  productId?: number;
  macAddress?: string;
  enabled?: boolean;
}

export interface PrinterState extends Required<Omit<PrinterConfig, 'ip' | 'port' | 'vendorId' | 'productId' | 'macAddress'>> {
  ip?: string;
  port?: number;
  vendorId?: number;
  productId?: number;
  macAddress?: string;
  status: PrinterStatus;
  jobsCompleted: number;
  lastError?: string;
  lastActiveAt?: number;
}

export interface PrintJob {
  id: string;
  data: string;
  timestamp: number;
  assignedTo?: string;
  priority: number;
  targetPrinterId?: string;  // Specify target printer
}

export type PrintEventType = 
  | 'job_queued' 
  | 'job_processing' 
  | 'job_completed' 
  | 'job_failed'
  | 'printer_added'
  | 'printer_removed'
  | 'printer_status_changed'
  | 'queue_cleared';

export interface PrintEvent {
  type: PrintEventType;
  timestamp: number;
  printerId?: string;
  jobId?: string;
  data?: any;
}

type EventListener = (event: PrintEvent) => void;

// ============ Logging ============

const LOG_PREFIX = '🖨️ [PrinterPool]';

const log = {
  info: (msg: string, ...args: any[]) => console.log(`${LOG_PREFIX} ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`${LOG_PREFIX} ⚠️ ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`${LOG_PREFIX} ❌ ${msg}`, ...args),
  success: (msg: string, ...args: any[]) => console.log(`${LOG_PREFIX} ✅ ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) => console.log(`${LOG_PREFIX} 🔍 ${msg}`, ...args),
};

// ============ Module Initialization ============

let printerModuleAvailable = false;

// Initialize printer module on load
(async () => {
  try {
    await NetPrinter.init();
    printerModuleAvailable = true;
    log.success('Thermal printer module initialized');
  } catch (e) {
    log.warn('Thermal printer module init failed:', e);
    printerModuleAvailable = false;
  }
})();

// ============ Configuration ============

/** Interval time between tasks (milliseconds) */
const JOB_INTERVAL = 300;

log.info(`Configuration: Dynamic print time (50ms/line, min 500ms, max 5000ms), timeout +3s, JOB_INTERVAL=${JOB_INTERVAL}ms`);

// ============ Printer Pool Manager ============

class PrinterPoolManager {
  private printers: Map<string, PrinterState> = new Map();
  private queue: PrintJob[] = [];
  private listeners: EventListener[] = [];

  // ============ Event System ============

  private emit(event: Omit<PrintEvent, 'timestamp'>) {
    const fullEvent: PrintEvent = { ...event, timestamp: Date.now() };
    this.listeners.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (e) {
        log.error('Listener error:', e);
      }
    });
  }

  addListener(callback: EventListener): () => void {
    this.listeners.push(callback);
    log.debug(`Event listener added (total: ${this.listeners.length})`);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
      log.debug(`Event listener removed (total: ${this.listeners.length})`);
    };
  }

  // ============ Printer Management ============

  addPrinter(config: PrinterConfig): boolean {
    if (this.printers.has(config.id)) {
      log.warn(`Printer already exists: ${config.id}`);
      return false;
    }

    const printerState: PrinterState = {
      ...config,
      enabled: config.enabled ?? true,
      status: 'idle',
      jobsCompleted: 0,
    };

    this.printers.set(config.id, printerState);

    this.emit({ 
      type: 'printer_added', 
      printerId: config.id,
      data: { name: config.name, type: config.type }
    });

    log.success(`Printer added: ${config.id} (${config.name}) [${config.type}]`);
    this.logPoolStatus();
    return true;
  }

  removePrinter(printerId: string): boolean {
    if (!this.printers.has(printerId)) {
      log.warn(`Printer not found: ${printerId}`);
      return false;
    }

    this.printers.delete(printerId);
    this.emit({ type: 'printer_removed', printerId });
    log.info(`Printer removed: ${printerId}`);
    this.logPoolStatus();
    return true;
  }

  updatePrinter(printerId: string, updates: Partial<PrinterConfig>): boolean {
    const printer = this.printers.get(printerId);
    if (!printer) {
      log.warn(`Printer not found for update: ${printerId}`);
      return false;
    }

    Object.assign(printer, updates);
    log.info(`Printer updated: ${printerId}`, updates);
    return true;
  }

  setPrinterEnabled(printerId: string, enabled: boolean): boolean {
    const printer = this.printers.get(printerId);
    if (!printer) {
      log.warn(`Printer not found: ${printerId}`);
      return false;
    }

    const oldStatus = printer.enabled;
    printer.enabled = enabled;
    if (enabled && printer.status === 'offline') {
      printer.status = 'idle';
    }

    log.info(`Printer ${printerId} enabled: ${oldStatus} → ${enabled}`);

    this.emit({
      type: 'printer_status_changed',
      printerId,
      data: { enabled, status: printer.status }
    });

    if (enabled) {
      this.tryProcessQueue();
    }

    return true;
  }

  setPrinterStatus(printerId: string, status: PrinterStatus, error?: string): void {
    const printer = this.printers.get(printerId);
    if (!printer) return;

    const oldStatus = printer.status;
    printer.status = status;
    if (error) printer.lastError = error;
    if (status === 'idle') printer.lastActiveAt = Date.now();

    log.info(`Printer ${printerId} status: ${oldStatus} → ${status}${error ? ` (error: ${error})` : ''}`);

    this.emit({
      type: 'printer_status_changed',
      printerId,
      data: { status, error }
    });

    if (status === 'idle') {
      this.tryProcessQueue();
    }
  }

  getPrinters(): PrinterState[] {
    return Array.from(this.printers.values());
  }

  getPrinter(printerId: string): PrinterState | undefined {
    return this.printers.get(printerId);
  }

  // ============ Job Management ============

  addJob(data: string, options?: { priority?: number; targetPrinterId?: string }): string {
    const availablePrinters = Array.from(this.printers.values()).filter(p => p.enabled);

    if (availablePrinters.length === 0) {
      log.error('No enabled printers available!');
      throw new Error('No enabled printers available');
    }

    // If target printer is specified, check if it exists and is enabled
    if (options?.targetPrinterId) {
      const targetPrinter = this.printers.get(options.targetPrinterId);
      if (!targetPrinter) {
        throw new Error(`Printer ${options.targetPrinterId} not found`);
      }
      if (!targetPrinter.enabled) {
        throw new Error(`Printer ${options.targetPrinterId} is disabled`);
      }
    }

    const job: PrintJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: Date.now(),
      priority: options?.priority ?? 0,
      targetPrinterId: options?.targetPrinterId,
    };

    // Insert into queue based on priority
    if (job.priority > 0) {
      const insertIndex = this.queue.findIndex(j => j.priority < job.priority);
      if (insertIndex === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(insertIndex, 0, job);
      }
      log.info(`📥 HIGH PRIORITY Job queued: ${job.id} (priority: ${job.priority})${job.targetPrinterId ? ` → ${job.targetPrinterId}` : ''}`);
    } else {
      this.queue.push(job);
      log.info(`📥 Job queued: ${job.id}${job.targetPrinterId ? ` → ${job.targetPrinterId}` : ''}`);
    }

    log.debug(`Queue length: ${this.queue.length}, Data preview: ${data.substring(0, 50)}...`);
    this.emit({ type: 'job_queued', jobId: job.id });

    this.tryProcessQueue();
    return job.id;
  }

  clearQueue(): number {
    const count = this.queue.length;
    this.queue = [];
    this.emit({ type: 'queue_cleared', data: { count } });
    log.info(`Queue cleared: ${count} jobs removed`);
    return count;
  }

  /**
   * Print directly to specified printer (bypasses queue)
   * Used for parallel printing scenarios
   */
  async printDirect(printerId: string, data: string): Promise<void> {
    const printer = this.printers.get(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }
    if (!printer.enabled) {
      throw new Error(`Printer ${printerId} is disabled`);
    }

    log.info(`🎯 Direct print to ${printer.name} (${printer.ip})`);
    
    // Execute print directly (mutex handled in printEthernet)
    await this.performPrint(printer, data);
    
    // Update statistics
    printer.jobsCompleted++;
    printer.lastActiveAt = Date.now();
    
    log.success(`✅ Direct print to ${printer.name} completed (total: ${printer.jobsCompleted})`);
  }

  // ============ Job Processing ============

  private tryProcessQueue(): void {
    if (this.queue.length === 0) {
      log.debug('Queue is empty, nothing to process');
      return;
    }

    // Get all printer statuses for logging
    const allPrinters = Array.from(this.printers.values());
    const enabledPrinters = allPrinters.filter(p => p.enabled);
    const idlePrinters = enabledPrinters.filter(p => p.status === 'idle');
    const busyPrinters = enabledPrinters.filter(p => p.status === 'busy');

    log.debug(`📊 Pool status: Total=${allPrinters.length}, Enabled=${enabledPrinters.length}, Idle=${idlePrinters.length}, Busy=${busyPrinters.length}, Queue=${this.queue.length}`);

    // Find tasks that can be processed
    for (let i = 0; i < this.queue.length; i++) {
      const job = this.queue[i];
      let selectedPrinter: PrinterState | undefined;

      if (job.targetPrinterId) {
        // Target printer specified, can only use this one
        const targetPrinter = this.printers.get(job.targetPrinterId);
        if (targetPrinter && targetPrinter.enabled && targetPrinter.status === 'idle') {
          selectedPrinter = targetPrinter;
          log.info(`🎯 Target printer: ${selectedPrinter.id} (${selectedPrinter.name})`);
        } else {
          // Target printer is busy or unavailable, skip this task and continue to next
          continue;
        }
      } else {
        // No printer specified, use load balancing
        if (idlePrinters.length === 0) {
          log.info(`⏳ All printers busy, job waiting in queue (queue: ${this.queue.length})`);
          return;
        }
        selectedPrinter = idlePrinters.sort((a, b) => a.jobsCompleted - b.jobsCompleted)[0];
        log.info(`🎯 Load balancing: Selected ${selectedPrinter.id} (${selectedPrinter.name}) - completed ${selectedPrinter.jobsCompleted} jobs`);
      }

      if (selectedPrinter) {
        // Remove this task from queue
        this.queue.splice(i, 1);
        job.assignedTo = selectedPrinter.id;
        this.executeJob(selectedPrinter, job);
        return; // Process one task at a time
      }
    }

    // All tasks are waiting for specific printers
    if (this.queue.length > 0) {
      log.info(`⏳ ${this.queue.length} jobs waiting for specific printers`);
    }
  }

  private async executeJob(printer: PrinterState, job: PrintJob): Promise<void> {
    printer.status = 'busy';
    const startTime = Date.now();
    
    // Dynamically calculate print time (consistent with original PrintQueue)
    const printTime = this.calculatePrintTime(job.data);
    
    log.info(`🚀 START: Job ${job.id} → ${printer.id} (${printer.name})`);
    log.info(`   Printer will be BUSY for ~${printTime}ms (based on content)`);
    this.emit({ type: 'job_processing', printerId: printer.id, jobId: job.id });

    try {
      log.debug(`   Sending data to printer...`);
      await this.performPrint(printer, job.data);
      log.debug(`   Data sent successfully`);
      
      // Wait for remaining print time (consistent with original PrintQueue)
      const elapsed = Date.now() - startTime;
      const remainingPrintTime = Math.max(0, printTime - elapsed);
      if (remainingPrintTime > 0) {
        log.info(`   ⏱️ Waiting ${remainingPrintTime}ms for print to complete...`);
        await this.delay(remainingPrintTime);
      }
      
      printer.jobsCompleted++;
      printer.status = 'idle';
      printer.lastActiveAt = Date.now();
      printer.lastError = undefined;

      const totalTime = Date.now() - startTime;
      log.success(`✅ DONE: Job ${job.id} on ${printer.id} (took ${totalTime}ms, total jobs: ${printer.jobsCompleted})`);
      this.emit({ type: 'job_completed', printerId: printer.id, jobId: job.id });
      
    } catch (error: any) {
      // Handle various error formats (native module may return non-standard Error)
      const errorMessage = error?.message || error?.toString?.() || String(error) || 'Unknown error';
      log.error(`Job ${job.id} FAILED on ${printer.id}: ${errorMessage}`);
      log.debug(`   Error details:`, error);
      
      printer.status = 'idle';
      printer.lastError = errorMessage;

      // Fail immediately on error, no retry
      this.emit({ 
        type: 'job_failed', 
        printerId: printer.id, 
        jobId: job.id,
        data: { error: errorMessage }
      });
    }

    // Process next task
    await this.delay(JOB_INTERVAL);
    log.debug(`Checking queue for next job...`);
    this.tryProcessQueue();
  }

  // ============ Printing Implementation ============

  // Calculate print time based on content lines (consistent with original PrintQueue)
  private calculatePrintTime(data: string): number {
    const lines = data.split('\n').length;
    // Approx 50ms per line, min 500ms, max 5000ms
    return Math.min(Math.max(lines * 50, 500), 5000);
  }

  private async performPrint(printer: PrinterState, data: string): Promise<void> {
    log.debug(`   Connecting to ${printer.type} printer: ${printer.id}`);
    
    switch (printer.type) {
      case 'ethernet':
        log.debug(`   → Ethernet: ${printer.ip}:${printer.port}`);
        await this.printEthernet(printer, data);
        break;
      case 'usb':
        log.debug(`   → USB: VID=${printer.vendorId} PID=${printer.productId}`);
        await this.printUSB(printer, data);
        break;
      case 'bluetooth':
        log.debug(`   → Bluetooth: ${printer.macAddress}`);
        await this.printBluetooth(printer, data);
        break;
    }
    
    log.debug(`   Print command sent successfully`);
  }

  private async printEthernet(printer: PrinterState, data: string): Promise<void> {
    if (!printerModuleAvailable) throw new Error('Printer module not available');
    if (!printer.ip) throw new Error('Printer IP not configured');

    const ip = printer.ip;
    const port = printer.port || 9100;

    // Use mutex to ensure atomic operation
    await printerMutex.acquire();
    log.info(`🔒 [${printer.name}] Acquired mutex, starting print...`);
    
    try {
      // 1. Close any existing connection first
      log.debug(`   [${printer.name}] Closing any existing connection...`);
      try { 
        await NetPrinter.closeConn(); 
        // Wait for connection to fully close
        await this.delay(100);
      } catch (e) {
        log.debug(`   [${printer.name}] No existing connection to close`);
      }
      
      // 2. Connect to printer (10 second timeout)
      log.info(`   [${printer.name}] Connecting to ${ip}:${port}...`);
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Connection timeout to ${ip}`)), 10000)
      );
      
      await Promise.race([
        NetPrinter.connectPrinter(ip, port),
        timeout
      ]);
      log.info(`   [${printer.name}] ✅ Connected`);
      
      // 3. Send print data
      log.info(`   [${printer.name}] Sending print data...`);
      await NetPrinter.printBill(data);
      log.success(`   [${printer.name}] ✅ Print sent to ${ip}:${port}`);
      
      // 4. Wait for printer to process data (important! cannot close connection too quickly)
      log.info(`   [${printer.name}] Waiting for printer to process...`);
      await this.delay(500);
      
      // 5. Close connection after printing is complete
      log.info(`   [${printer.name}] Closing connection...`);
      try {
        await NetPrinter.closeConn();
        await this.delay(100);
        log.info(`   [${printer.name}] ✅ Connection closed`);
      } catch (e) {
        log.warn(`   [${printer.name}] Failed to close connection: ${e}`);
      }
      
    } finally {
      // Ensure mutex is released
      log.info(`🔓 [${printer.name}] Releasing mutex`);
      printerMutex.release();
    }
  }

  private async printUSB(printer: PrinterState, data: string): Promise<void> {
    if (!printerModuleAvailable) throw new Error('Printer module not available');

    try {
      try { await USBPrinter.closeConn(); } catch {}

      await USBPrinter.init();
      const devices = await USBPrinter.getDeviceList();

      if (!devices || devices.length === 0) {
        throw new Error('No USB printer found');
      }

      const target = printer.vendorId && printer.productId
        ? devices.find((d: any) => d.vendor_id === printer.vendorId && d.product_id === printer.productId)
        : devices[0];

      if (!target) throw new Error('USB printer not found');

      await USBPrinter.connectPrinter(target.vendor_id, target.product_id);
      await USBPrinter.printBill(data);
      log.success(`USB print sent to VID=${target.vendor_id} PID=${target.product_id}`);
    } finally {
      // Keep connection open for reuse
    }
  }

  private async printBluetooth(printer: PrinterState, data: string): Promise<void> {
    if (!printerModuleAvailable) throw new Error('Printer module not available');

    await BLEPrinter.init();
    const devices = await BLEPrinter.getDeviceList();

    if (!devices || devices.length === 0) {
      throw new Error('No Bluetooth printer found');
    }

    const target = printer.macAddress
      ? devices.find((d: any) => d.inner_mac_address === printer.macAddress)
      : devices[0];

    if (!target) throw new Error('Bluetooth printer not found');

    await BLEPrinter.connectPrinter(target.inner_mac_address || target.device_name);
    await BLEPrinter.printBill(data);
    log.success(`Bluetooth print sent to ${target.inner_mac_address || target.device_name}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============ Cash Drawer ============

  async openCashDrawer(): Promise<void> {
    const printer = Array.from(this.printers.values())
      .find(p => p.enabled && p.status === 'idle');

    if (!printer) {
      log.error('No available printer for cash drawer');
      throw new Error('No available printer for cash drawer');
    }

    const DRAWER_KICK = '\x1B\x70\x00\x19\x19';
    log.info(`💰 Opening cash drawer via ${printer.id}`);

    switch (printer.type) {
      case 'ethernet':
        await this.printEthernet(printer, DRAWER_KICK);
        break;
      case 'usb':
        await this.printUSB(printer, DRAWER_KICK);
        break;
      case 'bluetooth':
        await this.printBluetooth(printer, DRAWER_KICK);
        break;
    }
    
    log.success('Cash drawer opened');
  }

  // ============ Status ============

  getStatus() {
    return {
      queueLength: this.queue.length,
      printers: Array.from(this.printers.values()).map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        enabled: p.enabled,
        jobsCompleted: p.jobsCompleted,
        lastError: p.lastError,
      })),
    };
  }

  /** Print current pool status to logs */
  logPoolStatus(): void {
    const printers = Array.from(this.printers.values());
    log.info(`═══════════════════════════════════════════════════`);
    log.info(`📊 POOL STATUS: ${printers.length} printers, ${this.queue.length} jobs queued`);
    printers.forEach(p => {
      const statusIcon = p.status === 'idle' ? '🟢' : p.status === 'busy' ? '🟡' : '🔴';
      const enabledIcon = p.enabled ? '✓' : '✗';
      log.info(`   ${statusIcon} ${p.id} (${p.name}) - ${p.status} [${enabledIcon}] - ${p.jobsCompleted} jobs done`);
    });
    log.info(`═══════════════════════════════════════════════════`);
  }

  isPrinterModuleAvailable(type: PrinterType): boolean {
    // All printer types use the same module, so check the common flag
    return printerModuleAvailable;
  }

  isAnyPrinterModuleAvailable(): boolean {
    return printerModuleAvailable;
  }
}

// ============ Singleton Export ============

export const printerPool = new PrinterPoolManager();

// ============ Helper Functions ============

/** Add printer */
export const addPrinter = (config: PrinterConfig) => printerPool.addPrinter(config);

/** Remove printer */
export const removePrinter = (printerId: string) => printerPool.removePrinter(printerId);

/** Update printer configuration */
export const updatePrinter = (printerId: string, updates: Partial<PrinterConfig>) => 
  printerPool.updatePrinter(printerId, updates);

/** Enable/disable printer */
export const setPrinterEnabled = (printerId: string, enabled: boolean) => 
  printerPool.setPrinterEnabled(printerId, enabled);

/** Get all printers */
export const getPrinters = () => printerPool.getPrinters();

/** Get single printer */
export const getPrinter = (printerId: string) => printerPool.getPrinter(printerId);

/** Add print job */
export const print = (data: string, options?: { priority?: number; targetPrinterId?: string }) => 
  printerPool.addJob(data, options);

// ============ ESC/POS Commands ============
const ESC = '\x1b';
const GS = '\x1d';

const ESCPOS = {
  // Initialize printer
  INIT: `${ESC}@`,
  
  // Alignment
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  
  // Font styles
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  
  // Font size (ESC ! n)
  NORMAL: `${ESC}!\x00`,
  DOUBLE_HEIGHT: `${ESC}!\x10`,
  DOUBLE_WIDTH: `${ESC}!\x20`,
  DOUBLE_SIZE: `${ESC}!\x30`,  // Double width and height
  
  // Cut paper
  CUT: `${GS}V\x00`,      // Full cut
  CUT_PARTIAL: `${GS}VA\x03`,  // Partial cut (leave a bit)
  
  // Line feed
  LF: '\n',
  
  // Paper feed
  FEED: `${ESC}d\x04`,  // Feed 4 lines
};

/**
 * Convert markup format to ESC/POS commands
 * Supports: <C>, <L>, <R>, <B>, </B>, <CB>, </CB>, <CD>, </CD>
 */
const convertToEscPos = (text: string): string => {
  let result = ESCPOS.INIT;  // Initialize printer
  
  // Process line by line
  const lines = text.split('\n');
  
  for (const line of lines) {
    let processedLine = line;
    let prefix = '';
    let suffix = '';
    
    // Center bold large text <CB>...</CB>
    if (processedLine.includes('<CB>')) {
      prefix += ESCPOS.ALIGN_CENTER + ESCPOS.BOLD_ON + ESCPOS.DOUBLE_SIZE;
      suffix = ESCPOS.NORMAL + ESCPOS.BOLD_OFF + suffix;
      processedLine = processedLine.replace(/<CB>/g, '').replace(/<\/CB>/g, '');
    }
    // Center double <CD>...</CD>
    else if (processedLine.includes('<CD>')) {
      prefix += ESCPOS.ALIGN_CENTER + ESCPOS.DOUBLE_SIZE;
      suffix = ESCPOS.NORMAL + suffix;
      processedLine = processedLine.replace(/<CD>/g, '').replace(/<\/CD>/g, '');
    }
    // Center <C>...</C>
    else if (processedLine.includes('<C>')) {
      prefix += ESCPOS.ALIGN_CENTER;
      suffix = ESCPOS.ALIGN_LEFT + suffix;
      processedLine = processedLine.replace(/<C>/g, '').replace(/<\/C>/g, '');
    }
    // Right align <R>...</R>
    else if (processedLine.includes('<R>')) {
      prefix += ESCPOS.ALIGN_RIGHT;
      suffix = ESCPOS.ALIGN_LEFT + suffix;
      processedLine = processedLine.replace(/<R>/g, '').replace(/<\/R>/g, '');
    }
    // Left align <L>...</L>
    else if (processedLine.includes('<L>')) {
      prefix += ESCPOS.ALIGN_LEFT;
      processedLine = processedLine.replace(/<L>/g, '').replace(/<\/L>/g, '');
    }
    
    // Bold <B>...</B>
    if (processedLine.includes('<B>')) {
      processedLine = processedLine.replace(/<B>/g, ESCPOS.BOLD_ON).replace(/<\/B>/g, ESCPOS.BOLD_OFF);
    }
    
    result += prefix + processedLine + suffix + ESCPOS.LF;
  }
  
  // Finally: paper feed + cut
  result += ESCPOS.FEED + ESCPOS.CUT;
  
  return result;
};

// TCP print configuration
const TCP_TIMEOUT = 500;  // Fixed 500ms timeout

/**
 * Simple TCP printing (fixed 500ms timeout, force disconnect on timeout)
 * Does not wait for any response, disconnect after sending
 */
const printViaTcpOnce = (ip: string, port: number, escPosData: string, printerName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    let client: ReturnType<typeof TcpSocket.createConnection> | null = null;
    let done = false;
    
    const finish = (success: boolean, error?: string) => {
      if (done) return;
      done = true;
      
      // Force cleanup socket
      if (client) {
        try { 
          client.removeAllListeners();
          client.destroy(); 
        } catch {}
        client = null;
      }
      
      if (success) {
        log.success(`✅ [${printerName}] OK`);
        resolve();
      } else {
        log.error(`❌ [${printerName}] ${error || 'Failed'}`);
        reject(new Error(error || 'Failed'));
      }
    };
    
    // 500ms hard timeout - force end regardless of state
    const timer = setTimeout(() => finish(false, 'Timeout'), TCP_TIMEOUT);
    
    try {
      client = TcpSocket.createConnection({ host: ip, port: port }, () => {
        if (done) return;
        
        // Connection successful, send data immediately
        try {
          client!.write(escPosData, 'binary', () => {
            // Sending complete, no wait for response, success immediately
            clearTimeout(timer);
            finish(true);
          });
        } catch (e) {
          clearTimeout(timer);
          finish(false, 'Write failed');
        }
      });
      
      // Error handling
      client.on('error', () => {
        clearTimeout(timer);
        finish(false, 'Connect failed');
      });
      
      // Set socket timeout (double insurance)
      client.setTimeout(TCP_TIMEOUT);
      client.on('timeout', () => {
        clearTimeout(timer);
        finish(false, 'Socket timeout');
      });
      
    } catch (err) {
      clearTimeout(timer);
      finish(false, 'Create failed');
    }
  });
};


/**
 * Print to single printer (using TCP, non-blocking)
 */
export const printToOne = async (printerId: string, data: string): Promise<{ success: boolean; error?: string }> => {
  const printer = printerPool.getPrinter(printerId);
  
  if (!printer) {
    return { success: false, error: 'Printer not found' };
  }
  
  if (!printer.enabled) {
    return { success: false, error: 'Printer disabled' };
  }
  
  if (!printer.ip) {
    return { success: false, error: 'No IP configured' };
  }
  
  log.info(`🖨️ Print to ${printer.name} (${printer.ip})`);
  
  const escPosData = convertToEscPos(data);
  
  try {
    await printViaTcpOnce(printer.ip, printer.port || 9100, escPosData, printer.name);
    printer.jobsCompleted++;
    printer.lastActiveAt = Date.now();
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
};

/** 
 * True parallel printing to all enabled printers
 * Uses independent TCP Socket, each printer has its own connection, truly simultaneous printing
 * One failure does not block other printers
 */
export const printToAll = async (data: string): Promise<{ 
  success: boolean; 
  results: Array<{ printer: string; success: boolean; error?: string }> 
}> => {
  const enabledPrinters = printerPool.getPrinters().filter(p => p.enabled && p.ip);
  
  if (enabledPrinters.length === 0) {
    log.error('printToAll: No enabled ethernet printers available');
    return { success: false, results: [] };
  }
  
  log.info(`========== 🚀 PARALLEL PRINT: ${enabledPrinters.length} printers ==========`);
  
  // Convert ESC/POS data (convert once, shared by all printers)
  const escPosData = convertToEscPos(data);
  
  // Create independent print task for each printer (non-blocking)
  const createPrintTask = (printer: typeof enabledPrinters[0]) => {
    const startTime = Date.now();
    
    return printViaTcpOnce(printer.ip!, printer.port || 9100, escPosData, printer.name)
      .then(() => {
        printer.jobsCompleted++;
        printer.lastActiveAt = Date.now();
        return { printer: printer.name, success: true as const };
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { printer: printer.name, success: false as const, error: errorMsg };
      });
  };
  
  // Start all print tasks simultaneously (using Promise.allSettled to ensure no mutual blocking)
  log.info(`⏳ Starting ${enabledPrinters.length} parallel connections...`);
  const startTime = Date.now();
  
  const settledResults = await Promise.allSettled(
    enabledPrinters.map(printer => createPrintTask(printer))
  );
  
  // Convert results
  const results = settledResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { 
        printer: enabledPrinters[index].name, 
        success: false as const, 
        error: result.reason?.message || 'Unknown error' 
      };
    }
  });
  
  const elapsed = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  log.info(`========== DONE in ${elapsed}ms: ${successCount}/${results.length} succeeded ==========`);
  
  return { 
    success: successCount > 0, 
    results 
  };
};

/** Clear queue */
export const clearQueue = () => printerPool.clearQueue();

/** Open cash drawer */
export const openCashDrawer = () => printerPool.openCashDrawer();

/** Get status */
export const getPoolStatus = () => printerPool.getStatus();

/** Print pool status to logs */
export const logPoolStatus = () => printerPool.logPoolStatus();

/** Add event listener */
export const addPrinterListener = (callback: EventListener) => printerPool.addListener(callback);

/** Check printer module availability */
export const isPrinterModuleAvailable = (type: PrinterType) => printerPool.isPrinterModuleAvailable(type);

/** Check if any printer module is available */
export const isAnyPrinterModuleAvailable = () => printerPool.isAnyPrinterModuleAvailable();

export default printerPool;
