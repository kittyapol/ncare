/**
 * Production Monitoring Service
 *
 * Provides error tracking, performance monitoring, and user analytics
 * Ready for integration with services like Sentry, LogRocket, or DataDog
 */

import env from '@/config/env';

// Error severity levels
export enum ErrorSeverity {
  Fatal = 'fatal',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Debug = 'debug',
}

// User context for error tracking
export interface UserContext {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
}

// Error context
export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  user?: UserContext;
}

// Performance metric types
export enum MetricType {
  PageLoad = 'page_load',
  ApiCall = 'api_call',
  UserInteraction = 'user_interaction',
  Custom = 'custom',
}

// Performance metric interface
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  metadata?: Record<string, unknown>;
}

/**
 * Monitoring Service Class
 */
class MonitoringService {
  private isInitialized = false;
  private userContext: UserContext | null = null;

  /**
   * Initialize monitoring service
   */
  init(): void {
    if (this.isInitialized) {
      console.warn('Monitoring service already initialized');
      return;
    }

    // Only initialize in production or when explicitly enabled
    if (!env.features.enableErrorReporting) {
      console.log('📊 Monitoring service disabled (development mode)');
      return;
    }

    try {
      // TODO: Initialize Sentry
      // Sentry.init({
      //   dsn: env.sentryDsn,
      //   environment: env.environment,
      //   tracesSampleRate: 1.0,
      // });

      this.isInitialized = true;
      console.log('✅ Monitoring service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring:', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: UserContext | null): void {
    this.userContext = user;

    if (this.isInitialized && user) {
      // TODO: Set Sentry user context
      // Sentry.setUser({
      //   id: user.id,
      //   username: user.username,
      //   email: user.email,
      // });

      console.log('👤 User context set:', user.username);
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    this.userContext = null;

    if (this.isInitialized) {
      // TODO: Clear Sentry user
      // Sentry.setUser(null);

      console.log('👤 User context cleared');
    }
  }

  /**
   * Capture error with context
   */
  captureError(
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.Error,
    context?: ErrorContext
  ): void {
    // Always log to console in development
    if (env.features.enableDebugMode) {
      console.group(`🔴 Error captured [${severity}]`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('User:', this.userContext);
      console.groupEnd();
    }

    // Send to monitoring service in production
    if (this.isInitialized) {
      // TODO: Send to Sentry
      // Sentry.captureException(error, {
      //   level: severity,
      //   contexts: {
      //     component: context?.component,
      //     action: context?.action,
      //   },
      //   extra: context?.metadata,
      // });
    }

    // Log to backend for persistent storage
    this.logErrorToBackend(error, severity, context);
  }

  /**
   * Capture message (non-error logging)
   */
  captureMessage(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.Info,
    context?: ErrorContext
  ): void {
    if (env.features.enableDebugMode) {
      console.log(`📝 Message [${severity}]:`, message, context);
    }

    if (this.isInitialized) {
      // TODO: Send to Sentry
      // Sentry.captureMessage(message, {
      //   level: severity,
      //   extra: context,
      // });
    }
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (env.features.enablePerformanceMonitoring) {
      console.log(`⚡ Performance [${metric.type}]:`, `${metric.name} = ${metric.value}${metric.unit}`);

      if (this.isInitialized) {
        // TODO: Send to monitoring service
        // This could be Sentry, DataDog, New Relic, etc.
      }
    }
  }

  /**
   * Track user action/event
   */
  trackEvent(
    eventName: string,
    properties?: Record<string, unknown>
  ): void {
    if (env.features.enableDebugMode) {
      console.log('📊 Event:', eventName, properties);
    }

    if (this.isInitialized) {
      // TODO: Send to analytics service
      // This could be Google Analytics, Mixpanel, etc.
    }
  }

  /**
   * Log error to backend API
   */
  private async logErrorToBackend(
    _error: Error,
    _severity: ErrorSeverity,
    _context?: ErrorContext
  ): Promise<void> {
    try {
      // Only send critical errors to backend to avoid overwhelming the server
      if (_severity === ErrorSeverity.Fatal || _severity === ErrorSeverity.Error) {
        // TODO: Implement backend error logging endpoint
        // await api.post('/logs/errors', {
        //   message: _error.message,
        //   stack: _error.stack,
        //   severity: _severity,
        //   context: _context,
        //   user: this.userContext,
        //   timestamp: new Date().toISOString(),
        //   userAgent: navigator.userAgent,
        //   url: window.location.href,
        // });
      }
    } catch (err) {
      // Silently fail - don't create infinite error loop
      console.error('Failed to log error to backend:', err);
    }
  }

  /**
   * Add breadcrumb (trail of events leading to error)
   */
  addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (this.isInitialized) {
      // TODO: Add to Sentry
      // Sentry.addBreadcrumb({
      //   category,
      //   message,
      //   data,
      //   timestamp: Date.now(),
      // });
    }

    if (env.features.enableDebugMode) {
      console.log(`🍞 Breadcrumb [${category}]:`, message, data);
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction(name: string, operation: string): PerformanceTransaction {
    return new PerformanceTransaction(name, operation, this);
  }
}

/**
 * Performance Transaction Class
 */
class PerformanceTransaction {
  private startTime: number;
  private spans: Map<string, number> = new Map();

  constructor(
    private name: string,
    private operation: string,
    private monitoring: MonitoringService
  ) {
    this.startTime = performance.now();
  }

  /**
   * Start a span (sub-operation)
   */
  startSpan(name: string): void {
    this.spans.set(name, performance.now());
  }

  /**
   * Finish a span
   */
  finishSpan(name: string): void {
    const startTime = this.spans.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.monitoring.trackPerformance({
        name: `${this.name}.${name}`,
        type: MetricType.Custom,
        value: duration,
        unit: 'ms',
        metadata: { operation: this.operation },
      });
      this.spans.delete(name);
    }
  }

  /**
   * Finish the transaction
   */
  finish(): void {
    const duration = performance.now() - this.startTime;
    this.monitoring.trackPerformance({
      name: this.name,
      type: MetricType.Custom,
      value: duration,
      unit: 'ms',
      metadata: { operation: this.operation },
    });
  }
}

// Export singleton instance
const monitoring = new MonitoringService();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  monitoring.init();
}

export default monitoring;

// Export helper functions for convenience
export const captureError = (error: Error, severity?: ErrorSeverity, context?: ErrorContext) =>
  monitoring.captureError(error, severity, context);

export const captureMessage = (message: string, severity?: ErrorSeverity, context?: ErrorContext) =>
  monitoring.captureMessage(message, severity, context);

export const trackPerformance = (metric: PerformanceMetric) =>
  monitoring.trackPerformance(metric);

export const trackEvent = (eventName: string, properties?: Record<string, unknown>) =>
  monitoring.trackEvent(eventName, properties);

export const setUser = (user: UserContext | null) =>
  monitoring.setUser(user);

export const clearUser = () =>
  monitoring.clearUser();

export const addBreadcrumb = (category: string, message: string, data?: Record<string, unknown>) =>
  monitoring.addBreadcrumb(category, message, data);

export const startTransaction = (name: string, operation: string) =>
  monitoring.startTransaction(name, operation);
