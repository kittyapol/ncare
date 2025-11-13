import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import env from '@/config/env';
import monitoring, { ErrorSeverity, MetricType } from '@/services/monitoring';

// Create axios instance with configuration
export const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request start time for performance tracking
    (config as any).metadata = { startTime: Date.now() };

    // Add breadcrumb for API request
    monitoring.addBreadcrumb('api', `Request: ${config.method?.toUpperCase()} ${config.url}`, {
      method: config.method,
      url: config.url,
    });

    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    monitoring.captureError(
      error as Error,
      ErrorSeverity.Error,
      {
        component: 'API',
        action: 'request_error',
      }
    );
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Track API performance
    const config = response.config as any;
    if (config.metadata?.startTime) {
      const duration = Date.now() - config.metadata.startTime;
      monitoring.trackPerformance({
        name: `API: ${config.method?.toUpperCase()} ${config.url}`,
        type: MetricType.ApiCall,
        value: duration,
        unit: 'ms',
        metadata: {
          status: response.status,
          url: config.url,
        },
      });
    }

    // Add breadcrumb for successful response
    monitoring.addBreadcrumb('api', `Response: ${response.status} ${response.config.url}`, {
      status: response.status,
    });

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${env.apiBaseUrl}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        useAuthStore.getState().login(access_token, refresh_token, useAuthStore.getState().user!);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - Permission denied
    if (error.response?.status === 403) {
      console.error('Permission denied:', error.response.data);
      // Could show a toast notification here
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.config?.url);
    }

    // Handle 422 Validation Error
    if (error.response?.status === 422) {
      console.error('Validation error:', error.response.data);
      // Format validation errors for display
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
      // Could show a generic error message to user
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - please check your connection');
      // Could show a network error notification
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - please try again');
    }

    // Log error details in development
    if (env.features.enableDebugMode) {
      console.group('API Error Details');
      console.error('URL:', error.config?.url);
      console.error('Method:', error.config?.method);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      console.groupEnd();
    }

    // Send error to monitoring service
    const severity = error.response?.status === 500 ? ErrorSeverity.Error : ErrorSeverity.Warning;
    monitoring.captureError(error as Error, severity, {
      component: 'API',
      action: 'response_error',
      metadata: {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      },
    });

    return Promise.reject(error);
  }
);

/**
 * Helper function to extract error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // API error with response
    if (error.response?.data?.detail) {
      return typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
    }

    // Network error
    if (error.message === 'Network Error') {
      return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง';
    }

    // Generic error
    return error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }

  // Non-axios error
  if (error instanceof Error) {
    return error.message;
  }

  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
};

/**
 * Helper function to check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.message === 'Network Error';
};

/**
 * Helper function to check if error is an auth error
 */
export const isAuthError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 401;
};

/**
 * Helper function to check if error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 422;
};

export default api;
