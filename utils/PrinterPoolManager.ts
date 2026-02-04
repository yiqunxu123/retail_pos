/**
 * Printer Pool Manager
 * 单打印机池管理系统 - 多打印机负载均衡
 */

import {
  NetPrinter,
  USBPrinter,
  BLEPrinter,
} from "react-native-thermal-receipt-printer";
import TcpSocket from "react-native-tcp-socket";

// ============ Mutex for Printer Access ============
// NetPrinter 是单例，需要互斥锁防止并发访问
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
  targetPrinterId?: string;  // 指定目标打印机
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

  addJob(data: string, options?: { priority?: number; targetPrinterId?: string }): string {
    const availablePrinters = Array.from(this.printers.values()).filter(p => p.enabled);

    if (availablePrinters.length === 0) {
      log.error('No enabled printers available!');
      throw new Error('No enabled printers available');
    }

    // 如果指定了目标打印机，检查是否存在且启用
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

    // 根据优先级插入队列
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
   * 直接打印到指定打印机（不走队列）
   * 用于并行打印场景
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
    
    // 直接执行打印（互斥锁在 printEthernet 中处理）
    await this.performPrint(printer, data);
    
    // 更新统计
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

    // 获取所有打印机状态用于日志
    const allPrinters = Array.from(this.printers.values());
    const enabledPrinters = allPrinters.filter(p => p.enabled);
    const idlePrinters = enabledPrinters.filter(p => p.status === 'idle');
    const busyPrinters = enabledPrinters.filter(p => p.status === 'busy');

    log.debug(`📊 Pool status: Total=${allPrinters.length}, Enabled=${enabledPrinters.length}, Idle=${idlePrinters.length}, Busy=${busyPrinters.length}, Queue=${this.queue.length}`);

    // 查找可以处理的任务
    for (let i = 0; i < this.queue.length; i++) {
      const job = this.queue[i];
      let selectedPrinter: PrinterState | undefined;

      if (job.targetPrinterId) {
        // 指定了目标打印机，只能用这台
        const targetPrinter = this.printers.get(job.targetPrinterId);
        if (targetPrinter && targetPrinter.enabled && targetPrinter.status === 'idle') {
          selectedPrinter = targetPrinter;
          log.info(`🎯 Target printer: ${selectedPrinter.id} (${selectedPrinter.name})`);
        } else {
          // 目标打印机忙或不可用，跳过这个任务，继续找下一个
          continue;
        }
      } else {
        // 没有指定打印机，用负载均衡
        if (idlePrinters.length === 0) {
          log.info(`⏳ All printers busy, job waiting in queue (queue: ${this.queue.length})`);
          return;
        }
        selectedPrinter = idlePrinters.sort((a, b) => a.jobsCompleted - b.jobsCompleted)[0];
        log.info(`🎯 Load balancing: Selected ${selectedPrinter.id} (${selectedPrinter.name}) - completed ${selectedPrinter.jobsCompleted} jobs`);
      }

      if (selectedPrinter) {
        // 从队列中移除这个任务
        this.queue.splice(i, 1);
        job.assignedTo = selectedPrinter.id;
        this.executeJob(selectedPrinter, job);
        return; // 一次只处理一个任务
      }
    }

    // 所有任务都在等待特定打印机
    if (this.queue.length > 0) {
      log.info(`⏳ ${this.queue.length} jobs waiting for specific printers`);
    }
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
    if (!printer.ip) throw new Error('Printer IP not configured');

    const ip = printer.ip;
    const port = printer.port || 9100;

    // 使用互斥锁保证原子操作
    await printerMutex.acquire();
    log.info(`🔒 [${printer.name}] Acquired mutex, starting print...`);
    
    try {
      // 1. 先关闭任何现有连接
      log.debug(`   [${printer.name}] Closing any existing connection...`);
      try { 
        await NetPrinter.closeConn(); 
        // 等待连接完全关闭
        await this.delay(100);
      } catch (e) {
        log.debug(`   [${printer.name}] No existing connection to close`);
      }
      
      // 2. 连接到打印机（超时 10 秒）
      log.info(`   [${printer.name}] Connecting to ${ip}:${port}...`);
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Connection timeout to ${ip}`)), 10000)
      );
      
      await Promise.race([
        NetPrinter.connectPrinter(ip, port),
        timeout
      ]);
      log.info(`   [${printer.name}] ✅ Connected`);
      
      // 3. 发送打印数据
      log.info(`   [${printer.name}] Sending print data...`);
      await NetPrinter.printBill(data);
      log.success(`   [${printer.name}] ✅ Print sent to ${ip}:${port}`);
      
      // 4. 等待打印机处理数据（重要！不能太快关闭连接）
      log.info(`   [${printer.name}] Waiting for printer to process...`);
      await this.delay(500);
      
      // 5. 打印完成后关闭连接
      log.info(`   [${printer.name}] Closing connection...`);
      try {
        await NetPrinter.closeConn();
        await this.delay(100);
        log.info(`   [${printer.name}] ✅ Connection closed`);
      } catch (e) {
        log.warn(`   [${printer.name}] Failed to close connection: ${e}`);
      }
      
    } finally {
      // 确保释放锁
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
export const print = (data: string, options?: { priority?: number; targetPrinterId?: string }) => 
  printerPool.addJob(data, options);

// ============ ESC/POS 命令 ============
const ESC = '\x1b';
const GS = '\x1d';

const ESCPOS = {
  // 初始化打印机
  INIT: `${ESC}@`,
  
  // 对齐方式
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  
  // 字体样式
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  
  // 字体大小 (ESC ! n)
  NORMAL: `${ESC}!\x00`,
  DOUBLE_HEIGHT: `${ESC}!\x10`,
  DOUBLE_WIDTH: `${ESC}!\x20`,
  DOUBLE_SIZE: `${ESC}!\x30`,  // 双倍宽高
  
  // 切纸
  CUT: `${GS}V\x00`,      // 全切
  CUT_PARTIAL: `${GS}VA\x03`,  // 部分切（留一点）
  
  // 换行
  LF: '\n',
  
  // 走纸
  FEED: `${ESC}d\x04`,  // 走 4 行
};

/**
 * 将标记格式转换为 ESC/POS 命令
 * 支持: <C>, <L>, <R>, <B>, </B>, <CB>, </CB>, <CD>, </CD>
 */
const convertToEscPos = (text: string): string => {
  let result = ESCPOS.INIT;  // 初始化打印机
  
  // 按行处理
  const lines = text.split('\n');
  
  for (const line of lines) {
    let processedLine = line;
    let prefix = '';
    let suffix = '';
    
    // 居中加粗大字 <CB>...</CB>
    if (processedLine.includes('<CB>')) {
      prefix += ESCPOS.ALIGN_CENTER + ESCPOS.BOLD_ON + ESCPOS.DOUBLE_SIZE;
      suffix = ESCPOS.NORMAL + ESCPOS.BOLD_OFF + suffix;
      processedLine = processedLine.replace(/<CB>/g, '').replace(/<\/CB>/g, '');
    }
    // 居中双倍 <CD>...</CD>
    else if (processedLine.includes('<CD>')) {
      prefix += ESCPOS.ALIGN_CENTER + ESCPOS.DOUBLE_SIZE;
      suffix = ESCPOS.NORMAL + suffix;
      processedLine = processedLine.replace(/<CD>/g, '').replace(/<\/CD>/g, '');
    }
    // 居中 <C>...</C>
    else if (processedLine.includes('<C>')) {
      prefix += ESCPOS.ALIGN_CENTER;
      suffix = ESCPOS.ALIGN_LEFT + suffix;
      processedLine = processedLine.replace(/<C>/g, '').replace(/<\/C>/g, '');
    }
    // 右对齐 <R>...</R>
    else if (processedLine.includes('<R>')) {
      prefix += ESCPOS.ALIGN_RIGHT;
      suffix = ESCPOS.ALIGN_LEFT + suffix;
      processedLine = processedLine.replace(/<R>/g, '').replace(/<\/R>/g, '');
    }
    // 左对齐 <L>...</L>
    else if (processedLine.includes('<L>')) {
      prefix += ESCPOS.ALIGN_LEFT;
      processedLine = processedLine.replace(/<L>/g, '').replace(/<\/L>/g, '');
    }
    
    // 加粗 <B>...</B>
    if (processedLine.includes('<B>')) {
      processedLine = processedLine.replace(/<B>/g, ESCPOS.BOLD_ON).replace(/<\/B>/g, ESCPOS.BOLD_OFF);
    }
    
    result += prefix + processedLine + suffix + ESCPOS.LF;
  }
  
  // 最后：走纸 + 切纸
  result += ESCPOS.FEED + ESCPOS.CUT;
  
  return result;
};

// TCP 打印配置（极短超时，快速失败）
const TCP_CONFIG = {
  TIMEOUT: 500,            // 总超时 500ms（连接+发送）
  PROCESS_DELAY: 100,      // 等待打印机处理 100ms
  MAX_RETRIES: 0,          // 不重试，失败就跳过
};

/**
 * 单次 TCP 打印（内部实现）
 */
const tcpPrintInternal = (ip: string, port: number, escPosData: string, printerName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let isDone = false;
    let client: ReturnType<typeof TcpSocket.createConnection> | null = null;
    
    const finish = (success: boolean, error?: Error) => {
      if (isDone) return;
      isDone = true;
      if (client) {
        try { client.destroy(); } catch {}
        client = null;
      }
      if (success) {
        resolve();
      } else {
        reject(error || new Error('Unknown error'));
      }
    };
    
    try {
      client = TcpSocket.createConnection({ host: ip, port: port }, () => {
        if (isDone) return;
        const connectTime = Date.now() - startTime;
        log.info(`✅ [${printerName}] Connected ${connectTime}ms`);
        
        client!.write(escPosData, 'binary', (err) => {
          if (isDone) return;
          if (err) {
            log.error(`❌ [${printerName}] Write error`);
            finish(false, err);
            return;
          }
          
          log.info(`📤 [${printerName}] Sent, waiting...`);
          setTimeout(() => {
            if (isDone) return;
            const total = Date.now() - startTime;
            log.success(`✅ [${printerName}] Done ${total}ms`);
            finish(true);
          }, TCP_CONFIG.PROCESS_DELAY);
        });
      });
      
      client.on('error', (err) => {
        if (isDone) return;
        log.error(`❌ [${printerName}] ${err.message}`);
        finish(false, err);
      });
      
    } catch (err) {
      finish(false, err instanceof Error ? err : new Error(String(err)));
    }
  });
};

/**
 * 单次 TCP 打印（500ms 硬超时，超时立即放弃）
 */
const printViaTcpOnce = async (ip: string, port: number, escPosData: string, printerName: string): Promise<void> => {
  log.info(`🔌 [${printerName}] → ${ip}`);
  
  // 硬超时 Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), TCP_CONFIG.TIMEOUT);
  });
  
  await Promise.race([
    tcpPrintInternal(ip, port, escPosData, printerName),
    timeoutPromise
  ]);
};


/** 
 * 真正并行打印到所有启用的打印机
 * 使用独立 TCP Socket，每台打印机有自己的连接，真正同时打印
 * 一台失败不会阻塞其他打印机
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
  
  // 转换 ESC/POS 数据（只转换一次，所有打印机共用）
  const escPosData = convertToEscPos(data);
  
  // 为每台打印机创建独立的打印任务（不互相阻塞）
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
  
  // 同时启动所有打印任务（使用 Promise.allSettled 确保不互相阻塞）
  log.info(`⏳ Starting ${enabledPrinters.length} parallel connections...`);
  const startTime = Date.now();
  
  const settledResults = await Promise.allSettled(
    enabledPrinters.map(printer => createPrintTask(printer))
  );
  
  // 转换结果
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

/**
 * TCP 直连打印到单台打印机（不经过队列，500ms 超时）
 */
export const printToOne = async (printerId: string, data: string): Promise<{ 
  success: boolean; 
  error?: string 
}> => {
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
  
  log.info(`🖨️ Direct print to ${printer.name} (${printer.ip})`);
  
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
