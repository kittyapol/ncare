# Testing Guide - Pharmacy ERP System

## 📋 Overview

This document provides comprehensive testing guidelines for the Pharmacy ERP frontend application. We use **Vitest** as our test runner with **React Testing Library** for component testing.

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## 📁 Test File Structure

```
apps/web/src/
├── components/
│   ├── common/
│   │   ├── LoadingSpinner.tsx
│   │   └── LoadingSpinner.test.tsx      ✅ Component test
│   └── ...
├── stores/
│   ├── authStore.ts
│   ├── authStore.test.ts                ✅ Store test
│   ├── cartStore.ts
│   └── cartStore.test.ts                ✅ Store test
├── services/
│   ├── monitoring.ts
│   └── monitoring.test.ts               ✅ Service test
└── tests/
    ├── setup.ts                         📝 Test configuration
    ├── utils.tsx                        🛠️ Test utilities
    └── mocks/
        └── mockData.ts                  📦 Mock data
```

## 🧪 Test Types

### 1. **Unit Tests** - Individual Functions & Utilities

Test pure functions, utilities, and isolated logic.

```typescript
// Example: Utility function test
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('should format number as Thai Baht', () => {
    expect(formatCurrency(1000)).toBe('฿1,000.00');
  });
});
```

### 2. **Store Tests** - Zustand State Management

Test state mutations, actions, and selectors.

```typescript
// Example: Store test
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('should login user', () => {
    useAuthStore.getState().login(mockUser, 'token', 'refresh');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
```

### 3. **Component Tests** - React Components

Test component rendering, user interactions, and prop changes.

```typescript
// Example: Component test
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render with props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle click event', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MyComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 4. **Service Tests** - API & External Services

Test API calls, error handling, and service logic.

```typescript
// Example: Service test
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { productApi } from './api';

vi.mock('axios');

describe('productApi', () => {
  it('should fetch products', async () => {
    axios.get.mockResolvedValue({ data: [mockProduct] });

    const products = await productApi.getAll();

    expect(products).toHaveLength(1);
    expect(axios.get).toHaveBeenCalledWith('/products');
  });
});
```

## 🛠️ Testing Utilities

### Test Utilities (`src/tests/utils.tsx`)

```typescript
import { renderWithProviders } from '@/tests/utils';

// Render with React Query and Router
const { getByText } = renderWithProviders(<MyComponent />);

// With initial route
renderWithProviders(<MyComponent />, {
  initialRoute: '/products',
});
```

### Mock Data (`src/tests/mocks/mockData.ts`)

```typescript
import { mockUser, mockProduct, mockCustomer } from '@/tests/mocks/mockData';

// Use in tests
const user = mockUser; // Pre-defined mock user
const product = mockProduct; // Pre-defined mock product
```

## 📊 Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| **Statements** | 80% | 🎯 |
| **Branches** | 80% | 🎯 |
| **Functions** | 80% | 🎯 |
| **Lines** | 80% | 🎯 |

```bash
# View coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/index.html
```

## ✅ Testing Best Practices

### DO ✅

1. **Write tests for critical paths**
   - Authentication flows
   - Payment processing
   - Prescription verification
   - Drug safety checks

2. **Test user behavior, not implementation**
   ```typescript
   // ✅ Good
   await user.click(screen.getByRole('button', { name: 'Submit' }));

   // ❌ Bad
   wrapper.find('.submit-button').simulate('click');
   ```

3. **Use descriptive test names**
   ```typescript
   // ✅ Good
   it('should display error message when login fails', () => {});

   // ❌ Bad
   it('test login', () => {});
   ```

4. **Keep tests isolated**
   - Use `beforeEach` to reset state
   - Don't depend on test execution order
   - Mock external dependencies

5. **Test error states**
   ```typescript
   it('should show error toast when API fails', async () => {
     apiMock.mockRejectedValue(new Error('Network error'));

     await user.click(screen.getByRole('button'));

     expect(screen.getByText(/เกิดข้อผิดพลาด/)).toBeInTheDocument();
   });
   ```

### DON'T ❌

1. **Don't test implementation details**
   - Don't test state variable names
   - Don't test internal functions
   - Test public API only

2. **Don't over-mock**
   - Only mock what's necessary
   - Prefer integration over mocking

3. **Don't test third-party libraries**
   - Assume they work correctly
   - Test your usage of them

4. **Don't write brittle tests**
   - Avoid specific HTML structure assertions
   - Use semantic queries (getByRole, getByLabelText)

## 🎯 What to Test

### **High Priority** 🔴

- [ ] Authentication (login, logout, token refresh)
- [ ] Cart operations (add, remove, calculate VAT)
- [ ] POS checkout flow
- [ ] Prescription verification workflow
- [ ] Drug safety checks
- [ ] Payment processing
- [ ] Error handling

### **Medium Priority** 🟡

- [ ] Product management (CRUD)
- [ ] Customer management
- [ ] Inventory lot tracking
- [ ] Reports generation
- [ ] User permissions

### **Low Priority** 🟢

- [ ] UI components (buttons, inputs)
- [ ] Layout components
- [ ] Utility functions
- [ ] Formatting functions

## 🔍 Debugging Tests

### Run specific test file

```bash
npm test -- src/stores/authStore.test.ts
```

### Run tests matching pattern

```bash
npm test -- --grep="login"
```

### Run with debugging

```bash
npm test -- --inspect-brk
```

### View test UI

```bash
npm run test:ui
```

## 🐛 Common Issues & Solutions

### Issue: Test fails with "Cannot find module"

**Solution**: Check your path aliases in `vitest.config.ts`

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue: Test timeout

**Solution**: Increase timeout for slow operations

```typescript
it('should load data', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Issue: React Query tests fail

**Solution**: Use test query client

```typescript
import { createTestQueryClient } from '@/tests/utils';

const queryClient = createTestQueryClient();
```

### Issue: localStorage not working

**Solution**: Already mocked in `src/tests/setup.ts`

## 📝 Writing New Tests

### 1. Create test file next to source

```
ProductList.tsx
ProductList.test.tsx  ← Create this
```

### 2. Follow naming convention

```typescript
describe('ComponentName or functionName', () => {
  describe('specific feature', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 3. Use AAA pattern

```typescript
it('should add item to cart', () => {
  // Arrange - Setup
  const item = mockCartItem;

  // Act - Execute
  useCartStore.getState().addItem(item);

  // Assert - Verify
  const state = useCartStore.getState();
  expect(state.items).toHaveLength(1);
});
```

## 🚀 CI/CD Integration

Tests automatically run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Zustand](https://github.com/pmndrs/zustand#testing)

## 🤝 Contributing

When adding new features:

1. ✅ Write tests **before** or **with** your code
2. ✅ Maintain minimum 80% coverage
3. ✅ Update this documentation if needed
4. ✅ Run tests before committing: `npm test`

---

**Last Updated**: 2025-11-13
**Maintained by**: Development Team
**Questions**: Create issue in GitHub
