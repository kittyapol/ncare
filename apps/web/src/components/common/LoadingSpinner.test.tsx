import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with default message', () => {
      render(<LoadingSpinner />);

      expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      const customMessage = 'กำลังโหลดข้อมูล...';
      render(<LoadingSpinner message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('fullScreen mode', () => {
    it('should render in fullScreen mode', () => {
      const { container } = render(<LoadingSpinner fullScreen />);

      const fullScreenDiv = container.querySelector('.fixed.inset-0');
      expect(fullScreenDiv).toBeInTheDocument();
    });

    it('should render inline by default', () => {
      const { container } = render(<LoadingSpinner />);

      const fullScreenDiv = container.querySelector('.fixed.inset-0');
      expect(fullScreenDiv).not.toBeInTheDocument();
    });

    it('should have correct classes in fullScreen mode', () => {
      const { container } = render(<LoadingSpinner fullScreen />);

      const fullScreenDiv = container.querySelector('.fixed.inset-0');
      expect(fullScreenDiv).toHaveClass('bg-white', 'z-50');
    });
  });

  describe('spinner animation', () => {
    it('should have animate-spin class', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have correct size classes for medium', () => {
      const { container } = render(<LoadingSpinner size="medium" />);

      const spinner = container.querySelector('.h-10.w-10');
      expect(spinner).toBeInTheDocument();
    });

    it('should have primary color', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('.border-t-primary-600');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('size variations', () => {
    it('should render small size', () => {
      const { container } = render(<LoadingSpinner size="small" />);

      const spinner = container.querySelector('.h-6.w-6');
      expect(spinner).toBeInTheDocument();
    });

    it('should render medium size', () => {
      const { container } = render(<LoadingSpinner size="medium" />);

      const spinner = container.querySelector('.h-10.w-10');
      expect(spinner).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<LoadingSpinner size="large" />);

      const spinner = container.querySelector('.h-16.w-16');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should be centered horizontally and vertically', () => {
      const { container } = render(<LoadingSpinner />);

      const flexContainer = container.querySelector('.flex.items-center.justify-center');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('message styling', () => {
    it('should have correct text color', () => {
      render(<LoadingSpinner message="Test" />);

      const message = screen.getByText('Test');
      expect(message).toHaveClass('text-gray-600');
    });

    it('should have margin top', () => {
      render(<LoadingSpinner message="Test" />);

      const message = screen.getByText('Test');
      expect(message).toHaveClass('mt-4');
    });
  });

  describe('loading dots animation', () => {
    it('should render three animated dots', () => {
      const { container } = render(<LoadingSpinner />);

      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots.length).toBeGreaterThanOrEqual(3);
    });
  });
});
