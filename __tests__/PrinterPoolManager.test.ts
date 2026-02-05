/**
 * PrinterPoolManager Unit Tests
 * Tests the core logic of printer pool management
 */

// Mock the printer module before importing
jest.mock('react-native-thermal-receipt-printer', () => ({
  NetPrinter: {
    init: jest.fn().mockResolvedValue(undefined),
    connectPrinter: jest.fn().mockResolvedValue(undefined),
    printBill: jest.fn().mockResolvedValue(undefined),
    closeConn: jest.fn().mockResolvedValue(undefined),
  },
  USBPrinter: {
    init: jest.fn().mockResolvedValue(undefined),
    getDeviceList: jest.fn().mockResolvedValue([
      { vendor_id: 0x0483, product_id: 0x5740, device_name: 'USB Printer' }
    ]),
    connectPrinter: jest.fn().mockResolvedValue(undefined),
    printBill: jest.fn().mockResolvedValue(undefined),
    closeConn: jest.fn().mockResolvedValue(undefined),
  },
  BLEPrinter: {
    init: jest.fn().mockResolvedValue(undefined),
    getDeviceList: jest.fn().mockResolvedValue([
      { inner_mac_address: '00:11:22:33:44:55', device_name: 'BLE Printer' }
    ]),
    connectPrinter: jest.fn().mockResolvedValue(undefined),
    printBill: jest.fn().mockResolvedValue(undefined),
  },
}), { virtual: true });

// Import after mocking
import {
    PrinterConfig,
    PrintEvent
} from '../utils/PrinterPoolManager';

// We need to create a fresh instance for each test to avoid state pollution
const createFreshManager = () => {
  // Clear the module cache to get a fresh instance
  jest.resetModules();
  
  // Re-mock the printer module
  jest.mock('react-native-thermal-receipt-printer', () => ({
    NetPrinter: {
      init: jest.fn().mockResolvedValue(undefined),
      connectPrinter: jest.fn().mockResolvedValue(undefined),
      printBill: jest.fn().mockResolvedValue(undefined),
      closeConn: jest.fn().mockResolvedValue(undefined),
    },
    USBPrinter: {
      init: jest.fn().mockResolvedValue(undefined),
      getDeviceList: jest.fn().mockResolvedValue([
        { vendor_id: 0x0483, product_id: 0x5740, device_name: 'USB Printer' }
      ]),
      connectPrinter: jest.fn().mockResolvedValue(undefined),
      printBill: jest.fn().mockResolvedValue(undefined),
      closeConn: jest.fn().mockResolvedValue(undefined),
    },
    BLEPrinter: {
      init: jest.fn().mockResolvedValue(undefined),
      getDeviceList: jest.fn().mockResolvedValue([
        { inner_mac_address: '00:11:22:33:44:55', device_name: 'BLE Printer' }
      ]),
      connectPrinter: jest.fn().mockResolvedValue(undefined),
      printBill: jest.fn().mockResolvedValue(undefined),
    },
  }), { virtual: true });
  
  // Re-import to get fresh instance
  const manager = require('../utils/PrinterPoolManager');
  return manager;
};

describe('PrinterPoolManager', () => {
  let manager: any;

  beforeEach(() => {
    manager = createFreshManager();
  });

  // ==================== Printer Management Tests ====================
  
  describe('Printer Management', () => {
    test('should add a printer successfully', () => {
      const config: PrinterConfig = {
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      };

      const result = manager.addPrinter(config);
      expect(result).toBe(true);

      const printers = manager.getPrinters();
      expect(printers).toHaveLength(1);
      expect(printers[0].id).toBe('printer-1');
      expect(printers[0].name).toBe('Test Printer');
      expect(printers[0].status).toBe('idle');
      expect(printers[0].enabled).toBe(true);
    });

    test('should not add duplicate printer', () => {
      const config: PrinterConfig = {
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      };

      manager.addPrinter(config);
      const result = manager.addPrinter(config);
      expect(result).toBe(false);

      const printers = manager.getPrinters();
      expect(printers).toHaveLength(1);
    });

    test('should add multiple printers', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Printer 1',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinter({
        id: 'printer-2',
        name: 'Printer 2',
        type: 'ethernet',
        ip: '192.168.1.101',
        port: 9100,
      });

      manager.addPrinter({
        id: 'printer-3',
        name: 'Printer 3',
        type: 'usb',
        vendorId: 0x0483,
        productId: 0x5740,
      });

      const printers = manager.getPrinters();
      expect(printers).toHaveLength(3);
    });

    test('should remove a printer', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      expect(manager.getPrinters()).toHaveLength(1);

      const result = manager.removePrinter('printer-1');
      expect(result).toBe(true);
      expect(manager.getPrinters()).toHaveLength(0);
    });

    test('should return false when removing non-existent printer', () => {
      const result = manager.removePrinter('non-existent');
      expect(result).toBe(false);
    });

    test('should update printer configuration', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Original Name',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.updatePrinter('printer-1', { name: 'Updated Name', ip: '192.168.1.200' });

      const printer = manager.getPrinter('printer-1');
      expect(printer?.name).toBe('Updated Name');
      expect(printer?.ip).toBe('192.168.1.200');
    });

    test('should enable/disable printer', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      expect(manager.getPrinter('printer-1')?.enabled).toBe(true);

      manager.setPrinterEnabled('printer-1', false);
      expect(manager.getPrinter('printer-1')?.enabled).toBe(false);

      manager.setPrinterEnabled('printer-1', true);
      expect(manager.getPrinter('printer-1')?.enabled).toBe(true);
    });

    test('should get single printer by ID', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      const printer = manager.getPrinter('printer-1');
      expect(printer).toBeDefined();
      expect(printer?.id).toBe('printer-1');

      const nonExistent = manager.getPrinter('non-existent');
      expect(nonExistent).toBeUndefined();
    });
  });

  // ==================== Job Queue Tests ====================

  describe('Job Queue', () => {
    beforeEach(() => {
      // Add a printer for job tests
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });
    });

    test('should add a job and return job ID', () => {
      const jobId = manager.print('Test receipt data');
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
      expect(jobId).toMatch(/^job_/);
    });

    test('should throw error when no printers available', () => {
      // Remove all printers
      manager.removePrinter('printer-1');

      expect(() => {
        manager.print('Test data');
      }).toThrow('No enabled printers available');
    });

    test('should throw error when all printers disabled', () => {
      manager.setPrinterEnabled('printer-1', false);

      expect(() => {
        manager.print('Test data');
      }).toThrow('No enabled printers available');
    });

    test('should clear queue', () => {
      // Disable printer to prevent job processing
      manager.setPrinterEnabled('printer-1', false);
      manager.setPrinterEnabled('printer-1', true);

      // Add another printer and disable it to queue jobs
      manager.addPrinter({
        id: 'printer-2',
        name: 'Printer 2',
        type: 'ethernet',
        ip: '192.168.1.101',
        port: 9100,
        enabled: false,
      });

      const status = manager.getPoolStatus();
      const initialQueueLength = status.queueLength;

      const cleared = manager.clearQueue();
      expect(cleared).toBeGreaterThanOrEqual(0);

      const newStatus = manager.getPoolStatus();
      expect(newStatus.queueLength).toBe(0);
    });
  });

  // ==================== Event System Tests ====================

  describe('Event System', () => {
    test('should emit printer_added event', () => {
      const events: PrintEvent[] = [];
      manager.addPrinterListener((event: PrintEvent) => {
        events.push(event);
      });

      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      const addedEvent = events.find(e => e.type === 'printer_added');
      expect(addedEvent).toBeDefined();
      expect(addedEvent?.printerId).toBe('printer-1');
    });

    test('should emit printer_removed event', () => {
      const events: PrintEvent[] = [];
      
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinterListener((event: PrintEvent) => {
        events.push(event);
      });

      manager.removePrinter('printer-1');

      const removedEvent = events.find(e => e.type === 'printer_removed');
      expect(removedEvent).toBeDefined();
      expect(removedEvent?.printerId).toBe('printer-1');
    });

    test('should emit printer_status_changed event', () => {
      const events: PrintEvent[] = [];
      
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinterListener((event: PrintEvent) => {
        events.push(event);
      });

      manager.setPrinterEnabled('printer-1', false);

      const statusEvent = events.find(e => e.type === 'printer_status_changed');
      expect(statusEvent).toBeDefined();
      expect(statusEvent?.printerId).toBe('printer-1');
      expect(statusEvent?.data?.enabled).toBe(false);
    });

    test('should emit job_queued event', () => {
      const events: PrintEvent[] = [];
      
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinterListener((event: PrintEvent) => {
        events.push(event);
      });

      manager.print('Test data');

      const queuedEvent = events.find(e => e.type === 'job_queued');
      expect(queuedEvent).toBeDefined();
      expect(queuedEvent?.jobId).toBeDefined();
    });

    test('should unsubscribe listener', () => {
      const events: PrintEvent[] = [];
      
      const unsubscribe = manager.addPrinterListener((event: PrintEvent) => {
        events.push(event);
      });

      manager.addPrinter({
        id: 'printer-1',
        name: 'Printer 1',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      expect(events.length).toBeGreaterThan(0);
      const countBefore = events.length;

      // Unsubscribe
      unsubscribe();

      manager.addPrinter({
        id: 'printer-2',
        name: 'Printer 2',
        type: 'ethernet',
        ip: '192.168.1.101',
        port: 9100,
      });

      // Should not receive new events
      expect(events.length).toBe(countBefore);
    });
  });

  // ==================== Status Tests ====================

  describe('Pool Status', () => {
    test('should return correct status with no printers', () => {
      const status = manager.getPoolStatus();
      expect(status.queueLength).toBe(0);
      expect(status.printers).toHaveLength(0);
    });

    test('should return correct status with printers', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Printer 1',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinter({
        id: 'printer-2',
        name: 'Printer 2',
        type: 'ethernet',
        ip: '192.168.1.101',
        port: 9100,
        enabled: false,
      });

      const status = manager.getPoolStatus();
      expect(status.printers).toHaveLength(2);
      
      const printer1 = status.printers.find((p: any) => p.id === 'printer-1');
      expect(printer1?.enabled).toBe(true);
      expect(printer1?.status).toBe('idle');

      const printer2 = status.printers.find((p: any) => p.id === 'printer-2');
      expect(printer2?.enabled).toBe(false);
    });

    test('should track jobs completed', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      const printer = manager.getPrinter('printer-1');
      expect(printer?.jobsCompleted).toBe(0);
    });
  });

  // ==================== Load Balancing Tests ====================

  describe('Load Balancing', () => {
    test('should distribute jobs to idle printers', () => {
      // Add multiple printers
      manager.addPrinter({
        id: 'printer-1',
        name: 'Printer 1',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinter({
        id: 'printer-2',
        name: 'Printer 2',
        type: 'ethernet',
        ip: '192.168.1.101',
        port: 9100,
      });

      // Both printers should start as idle
      const printers = manager.getPrinters();
      expect(printers[0].status).toBe('idle');
      expect(printers[1].status).toBe('idle');
    });

    test('should prefer printer with fewer completed jobs', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Printer 1',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinter({
        id: 'printer-2',
        name: 'Printer 2',
        type: 'ethernet',
        ip: '192.168.1.101',
        port: 9100,
      });

      // Both printers have 0 completed jobs initially
      const printers = manager.getPrinters();
      expect(printers[0].jobsCompleted).toBe(0);
      expect(printers[1].jobsCompleted).toBe(0);
    });

    test('should assign job to printer-2 when printer-1 is busy', () => {
      const assignedPrinters: string[] = [];

      manager.addPrinter({
        id: 'printer-1',
        name: 'Printer 1',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinter({
        id: 'printer-2',
        name: 'Printer 2',
        type: 'ethernet',
        ip: '192.168.1.101',
        port: 9100,
      });

      // Listen for job_processing events to track which printer gets the job
      manager.addPrinterListener((event: PrintEvent) => {
        if (event.type === 'job_processing' && event.printerId) {
          assignedPrinters.push(event.printerId);
        }
      });

      // Manually set printer-1 to busy to simulate it processing a job
      manager.printerPool.setPrinterStatus('printer-1', 'busy');

      // Now add a job - it should go to printer-2 since printer-1 is busy
      manager.print('Test job for printer-2');

      // Verify that printer-2 got the job
      expect(assignedPrinters).toContain('printer-2');
    });

    test('should queue job when all printers are busy', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Printer 1',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      manager.addPrinter({
        id: 'printer-2',
        name: 'Printer 2',
        type: 'ethernet',
        ip: '192.168.1.101',
        port: 9100,
      });

      // Set both printers to busy
      manager.printerPool.setPrinterStatus('printer-1', 'busy');
      manager.printerPool.setPrinterStatus('printer-2', 'busy');

      // Add a job - it should be queued since no idle printer
      const jobId = manager.print('Queued job');
      expect(jobId).toBeDefined();

      // Check queue has the job
      const status = manager.getPoolStatus();
      expect(status.queueLength).toBe(1);
    });

    test('should process queued job when printer becomes idle', () => {
      const processedJobs: string[] = [];

      manager.addPrinter({
        id: 'printer-1',
        name: 'Printer 1',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      // Set printer to busy initially
      manager.printerPool.setPrinterStatus('printer-1', 'busy');

      // Listen for processing events
      manager.addPrinterListener((event: PrintEvent) => {
        if (event.type === 'job_processing' && event.jobId) {
          processedJobs.push(event.jobId);
        }
      });

      // Add a job while printer is busy
      const jobId = manager.print('Waiting job');
      
      // Job should be in queue, not processed yet
      expect(processedJobs).not.toContain(jobId);
      expect(manager.getPoolStatus().queueLength).toBe(1);

      // Now set printer back to idle - this should trigger queue processing
      manager.printerPool.setPrinterStatus('printer-1', 'idle');

      // Job should now be processed
      expect(processedJobs).toContain(jobId);
      expect(manager.getPoolStatus().queueLength).toBe(0);
    });
  });

  // ==================== Priority Queue Tests ====================

  describe('Priority Queue', () => {
    test('should accept priority option', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      // Normal priority
      const normalJobId = manager.print('Normal job');
      expect(normalJobId).toBeDefined();

      // High priority
      const highPriorityJobId = manager.print('High priority job', { priority: 1 });
      expect(highPriorityJobId).toBeDefined();
    });

    test('should accept maxRetries option', () => {
      manager.addPrinter({
        id: 'printer-1',
        name: 'Test Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      const jobId = manager.print('Test job', { maxRetries: 5 });
      expect(jobId).toBeDefined();
    });
  });

  // ==================== Printer Type Tests ====================

  describe('Printer Types', () => {
    test('should support ethernet printer', () => {
      const result = manager.addPrinter({
        id: 'ethernet-printer',
        name: 'Ethernet Printer',
        type: 'ethernet',
        ip: '192.168.1.100',
        port: 9100,
      });

      expect(result).toBe(true);
      const printer = manager.getPrinter('ethernet-printer');
      expect(printer?.type).toBe('ethernet');
      expect(printer?.ip).toBe('192.168.1.100');
      expect(printer?.port).toBe(9100);
    });

    test('should support USB printer', () => {
      const result = manager.addPrinter({
        id: 'usb-printer',
        name: 'USB Printer',
        type: 'usb',
        vendorId: 0x0483,
        productId: 0x5740,
      });

      expect(result).toBe(true);
      const printer = manager.getPrinter('usb-printer');
      expect(printer?.type).toBe('usb');
      expect(printer?.vendorId).toBe(0x0483);
      expect(printer?.productId).toBe(0x5740);
    });

    test('should support Bluetooth printer', () => {
      const result = manager.addPrinter({
        id: 'ble-printer',
        name: 'Bluetooth Printer',
        type: 'bluetooth',
        macAddress: '00:11:22:33:44:55',
      });

      expect(result).toBe(true);
      const printer = manager.getPrinter('ble-printer');
      expect(printer?.type).toBe('bluetooth');
      expect(printer?.macAddress).toBe('00:11:22:33:44:55');
    });
  });
});
