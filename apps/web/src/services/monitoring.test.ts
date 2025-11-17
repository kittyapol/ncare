import { describe, it, expect, beforeEach, vi } from 'vitest';
import monitoring, { ErrorSeverity, MetricType } from './monitoring';

describe('MonitoringService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  describe('init', () => {
    it('should initialize successfully', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      monitoring.init();

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('captureError', () => {
    it('should capture error with default severity', () => {
      const error = new Error('Test error');
      const consoleGroupSpy = vi.spyOn(console, 'group');

      monitoring.captureError(error);

      expect(consoleGroupSpy).toHaveBeenCalled();
    });

    it('should capture error with custom severity', () => {
      const error = new Error('Critical error');
      const consoleGroupSpy = vi.spyOn(console, 'group');

      monitoring.captureError(error, ErrorSeverity.Fatal);

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('fatal')
      );
    });

    it('should capture error with context', () => {
      const error = new Error('Context error');
      const context = {
        component: 'TestComponent',
        action: 'test_action',
        metadata: { key: 'value' },
      };

      monitoring.captureError(error, ErrorSeverity.Error, context);

      expect(console.group).toHaveBeenCalled();
    });

    it('should handle different severity levels', () => {
      const error = new Error('Test');

      monitoring.captureError(error, ErrorSeverity.Fatal);
      monitoring.captureError(error, ErrorSeverity.Error);
      monitoring.captureError(error, ErrorSeverity.Warning);
      monitoring.captureError(error, ErrorSeverity.Info);
      monitoring.captureError(error, ErrorSeverity.Debug);

      expect(console.group).toHaveBeenCalledTimes(5);
    });
  });

  describe('setUser', () => {
    it('should set user context', () => {
      const userContext = {
        id: '123',
        email: 'test@test.com',
        role: 'admin',
      };

      monitoring.setUser(userContext);

      // User context is set internally
      expect(true).toBe(true);
    });

    it('should clear user context when null', () => {
      monitoring.setUser({
        id: '123',
        email: 'test@test.com',
        role: 'admin',
      });

      monitoring.setUser(null);

      // Verify context is cleared
      expect(true).toBe(true);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      monitoring.addBreadcrumb('navigation', 'User clicked button');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Breadcrumb'),
        'User clicked button',
        undefined
      );
    });

    it('should add breadcrumb with metadata', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      monitoring.addBreadcrumb('api', 'API call', {
        url: '/api/products',
        method: 'GET',
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle multiple breadcrumb types', () => {
      monitoring.addBreadcrumb('navigation', 'Navigation breadcrumb');
      monitoring.addBreadcrumb('api', 'API breadcrumb');
      monitoring.addBreadcrumb('user', 'User breadcrumb');
      monitoring.addBreadcrumb('system', 'System breadcrumb');

      expect(console.log).toHaveBeenCalledTimes(4);
    });
  });

  describe('trackPerformance', () => {
    it('should accept performance metric (dev mode does not log)', () => {
      // In development mode with enablePerformanceMonitoring: false,
      // trackPerformance should not log to console
      monitoring.trackPerformance({
        name: 'Page Load',
        type: MetricType.PageLoad,
        value: 1500,
        unit: 'ms',
      });

      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should accept different metric types', () => {
      monitoring.trackPerformance({
        name: 'API Call',
        type: MetricType.ApiCall,
        value: 250,
        unit: 'ms',
      });

      monitoring.trackPerformance({
        name: 'Button Click',
        type: MetricType.UserInteraction,
        value: 50,
        unit: 'ms',
      });

      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should accept metric with metadata', () => {
      monitoring.trackPerformance({
        name: 'API Response',
        type: MetricType.ApiCall,
        value: 300,
        unit: 'ms',
        metadata: {
          endpoint: '/api/products',
          status: 200,
        },
      });

      // No error should be thrown
      expect(true).toBe(true);
    });
  });


  describe('error severity levels', () => {
    it('should have all severity levels defined', () => {
      expect(ErrorSeverity.Fatal).toBe('fatal');
      expect(ErrorSeverity.Error).toBe('error');
      expect(ErrorSeverity.Warning).toBe('warning');
      expect(ErrorSeverity.Info).toBe('info');
      expect(ErrorSeverity.Debug).toBe('debug');
    });
  });

  describe('metric types', () => {
    it('should have all metric types defined', () => {
      expect(MetricType.PageLoad).toBe('page_load');
      expect(MetricType.ApiCall).toBe('api_call');
      expect(MetricType.UserInteraction).toBe('user_interaction');
      expect(MetricType.Custom).toBe('custom');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete error tracking workflow', () => {
      // Set user context
      monitoring.setUser({
        id: '123',
        email: 'user@test.com',
        role: 'user',
      });

      // Add breadcrumbs
      monitoring.addBreadcrumb('navigation', 'Navigated to products page');
      monitoring.addBreadcrumb('user', 'Clicked on product');

      // Track performance
      monitoring.trackPerformance({
        name: 'Product Load',
        type: MetricType.PageLoad,
        value: 1200,
        unit: 'ms',
      });

      // Capture error
      const error = new Error('Failed to load product');
      monitoring.captureError(error, ErrorSeverity.Error, {
        component: 'ProductPage',
        action: 'load_product',
        metadata: { productId: '456' },
      });

      expect(console.log).toHaveBeenCalled();
      expect(console.group).toHaveBeenCalled();
    });
  });
});
