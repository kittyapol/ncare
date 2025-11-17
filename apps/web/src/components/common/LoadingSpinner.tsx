interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  fullScreen = false,
  message = 'กำลังโหลด...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-10 w-10',
    large: 'h-16 w-16',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Spinner with gradient animation */}
        <div className="relative inline-flex items-center justify-center">
          {/* Outer ring */}
          <div className={`${sizeClasses[size]} relative`}>
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>

          {/* Inner pulse */}
          <div className="absolute">
            <div className={`${size === 'small' ? 'h-2 w-2' : size === 'medium' ? 'h-3 w-3' : 'h-4 w-4'} bg-primary-600 rounded-full animate-pulse`}></div>
          </div>
        </div>

        {/* Loading message */}
        {message && (
          <p className={`mt-4 text-gray-600 font-medium ${size === 'small' ? 'text-sm' : 'text-base'}`}>
            {message}
          </p>
        )}

        {/* Loading dots animation */}
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
