/**
 * Environment Configuration
 *
 * This file centralizes all environment-specific configuration.
 * Use Vite's import.meta.env for accessing environment variables.
 */

interface EnvironmentConfig {
  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;

  // Application Configuration
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';

  // Feature Flags
  features: {
    enableDebugMode: boolean;
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
  };

  // Pagination
  defaultPageSize: number;

  // Session
  sessionTimeout: number; // in minutes
}

// Get environment mode
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Determine environment
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const mode = import.meta.env.MODE;
  if (mode === 'production') return 'production';
  if (mode === 'staging') return 'staging';
  return 'development';
};

// Environment configuration
const env: EnvironmentConfig = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000, // 30 seconds

  // Application Configuration
  appName: 'Pharmacy ERP',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: getEnvironment(),

  // Feature Flags
  features: {
    enableDebugMode: isDevelopment,
    enableErrorReporting: isProduction,
    enablePerformanceMonitoring: isProduction,
  },

  // Pagination
  defaultPageSize: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20,

  // Session
  sessionTimeout: Number(import.meta.env.VITE_SESSION_TIMEOUT) || 60, // 60 minutes
};

// Validate required environment variables
const validateEnv = () => {
  const requiredVars = ['VITE_API_BASE_URL'];
  const missing = requiredVars.filter(
    (varName) => !import.meta.env[varName] && !env.apiBaseUrl.includes('localhost')
  );

  if (missing.length > 0 && isProduction) {
    console.error('Missing required environment variables:', missing);
    // In production, we might want to show an error page
  }
};

// Run validation
validateEnv();

// Export configuration
export default env;

// Export helper functions
export const isDevMode = () => env.environment === 'development';
export const isProdMode = () => env.environment === 'production';
export const isStagingMode = () => env.environment === 'staging';

// Log configuration in development
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    environment: env.environment,
    apiBaseUrl: env.apiBaseUrl,
    features: env.features,
  });
}
