/**
 * Printer Pool Manager
 * 单打印机池管理系统 - 多打印机负载均衡
 */

import {
  NetPrinter,
  USBPrinter,
  BLEPrinter,
} from "react-native-thermal-receipt-printer";

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

/** 任务之间的间隔时间（毫秒） */
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

  addJob(data: string, options?: { priority?: number }): string {
    const availablePrinters = Array.from(this.printers.values()).filter(p => p.enabled);

    if (availablePrinters.length === 0) {
      log.error('No enabled printers available!');
      throw new Error('No enabled printers available');
    }

    const job: PrintJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: Date.now(),
      priority: options?.priority ?? 0,
    };

    // 根据优先级插入队列
    if (job.priority > 0) {
      const insertIndex = this.queue.findIndex(j => j.priority < job.priority);
      if (insertIndex === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(insertIndex, 0, job);
      }
      log.info(`📥 HIGH PRIORITY Job queued: ${job.id} (priority: ${job.priority})`);
    } else {
      this.queue.push(job);
      log.info(`📥 Job queued: ${job.id}`);
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

  // ============ Job Processing ============

  private tryProcessQueue(): void {
    if (this.queue.length === 0) {
      log.debug('Queue is empty, nothing to process');
      return;
    }

    // 获取所有打印机状态用于日志
    const allPrinters = Array.from(this.printers.values());
    const enabledPrinters = allPrinters.filter(p => p.enabled);
    const idlePrinters = enabledPrinters.filter(p => p.status === 'idle');
    const busyPrinters = enabledPrinters.filter(p => p.status === 'busy');

    log.debug(`📊 Pool status: Total=${allPrinters.length}, Enabled=${enabledPrinters.length}, Idle=${idlePrinters.length}, Busy=${busyPrinters.length}, Queue=${this.queue.length}`);

    if (idlePrinters.length === 0) {
      log.info(`⏳ All printers busy, job waiting in queue (queue: ${this.queue.length})`);
      busyPrinters.forEach(p => {
        log.debug(`  - ${p.id} (${p.name}): BUSY, completed ${p.jobsCompleted} jobs`);
      });
      return;
    }

    // 负载均衡：选择完成任务最少的空闲打印机
    const selectedPrinter = idlePrinters.sort((a, b) => a.jobsCompleted - b.jobsCompleted)[0];
    
    log.info(`🎯 Load balancing: Selected ${selectedPrinter.id} (${selectedPrinter.name}) - completed ${selectedPrinter.jobsCompleted} jobs`);
    idlePrinters.forEach(p => {
      const marker = p.id === selectedPrinter.id ? '→' : ' ';
      log.debug(`  ${marker} ${p.id}: ${p.jobsCompleted} jobs completed`);
    });

    const job = this.queue.shift();
    if (!job) return;

    job.assignedTo = selectedPrinter.id;
    this.executeJob(selectedPrinter, job);
  }

  private async executeJob(printer: PrinterState, job: PrintJob): Promise<void> {
    printer.status = 'busy';
    const startTime = Date.now();
    
    // 动态计算打印时间（与原 PrintQueue 一致）
    const printTime = this.calculatePrintTime(job.data);
    
    log.info(`🚀 START: Job ${job.id} → ${printer.id} (${printer.name})`);
    log.info(`   Printer will be BUSY for ~${printTime}ms (based on content)`);
    this.emit({ type: 'job_processing', printerId: printer.id, jobId: job.id });

    try {
      log.debug(`   Sending data to printer...`);
      await this.performPrint(printer, job.data);
      log.debug(`   Data sent successfully`);
      
      // 等待剩余的打印时间（与原 PrintQueue 一致）
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
      // 处理各种错误格式（原生模块可能返回非标准 Error）
      const errorMessage = error?.message || error?.toString?.() || String(error) || 'Unknown error';
      log.error(`Job ${job.id} FAILED on ${printer.id}: ${errorMessage}`);
      log.debug(`   Error details:`, error);
      
      printer.status = 'idle';
      printer.lastError = errorMessage;

      // 出错直接失败，不重试
      this.emit({ 
        type: 'job_failed', 
        printerId: printer.id, 
        jobId: job.id,
        data: { error: errorMessage }
      });
    }

    // 处理下一个任务
    await this.delay(JOB_INTERVAL);
    log.debug(`Checking queue for next job...`);
    this.tryProcessQueue();
  }

  // ============ Printing Implementation ============

  // 根据内容行数计算打印时间（与原 PrintQueue 一致）
  private calculatePrintTime(data: string): number {
    const lines = data.split('\n').length;
    // 每行约 50ms，最小 500ms，最大 5000ms
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

    // 连接超时 10 秒
    const connectWithTimeout = async () => {
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000)
      );
      
      try { await NetPrinter.closeConn(); } catch {}
      
      await Promise.race([
        NetPrinter.connectPrinter(printer.ip, printer.port || 9100),
        timeout
      ]);
      
      await NetPrinter.printBill(data);
    };

    await connectWithTimeout();
    log.success(`Ethernet print sent to ${printer.ip}:${printer.port || 9100}`);
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

  /** 打印当前池状态到日志 */
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

/** 添加打印机 */
export const addPrinter = (config: PrinterConfig) => printerPool.addPrinter(config);

/** 移除打印机 */
export const removePrinter = (printerId: string) => printerPool.removePrinter(printerId);

/** 更新打印机配置 */
export const updatePrinter = (printerId: string, updates: Partial<PrinterConfig>) => 
  printerPool.updatePrinter(printerId, updates);

/** 启用/禁用打印机 */
export const setPrinterEnabled = (printerId: string, enabled: boolean) => 
  printerPool.setPrinterEnabled(printerId, enabled);

/** 获取所有打印机 */
export const getPrinters = () => printerPool.getPrinters();

/** 获取单个打印机 */
export const getPrinter = (printerId: string) => printerPool.getPrinter(printerId);

/** 添加打印任务 */
export const print = (data: string, options?: { priority?: number }) => 
  printerPool.addJob(data, options);

/** 清空队列 */
export const clearQueue = () => printerPool.clearQueue();

/** 打开钱箱 */
export const openCashDrawer = () => printerPool.openCashDrawer();

/** 获取状态 */
export const getPoolStatus = () => printerPool.getStatus();

/** 打印池状态到日志 */
export const logPoolStatus = () => printerPool.logPoolStatus();

/** 添加事件监听 */
export const addPrinterListener = (callback: EventListener) => printerPool.addListener(callback);

/** 检查打印机模块可用性 */
export const isPrinterModuleAvailable = (type: PrinterType) => printerPool.isPrinterModuleAvailable(type);

/** 检查是否有任何打印机模块可用 */
export const isAnyPrinterModuleAvailable = () => printerPool.isAnyPrinterModuleAvailable();

export default printerPool;
