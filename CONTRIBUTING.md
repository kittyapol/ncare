# Contributing to NCare Pharmacy ERP

Thank you for your interest in contributing to NCare Pharmacy ERP! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and encourage diverse perspectives
- Focus on constructive feedback
- Prioritize the community and project goals

## 🚀 Getting Started

### 1. Fork and Clone

\`\`\`bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/ncare.git
cd ncare

# Add upstream remote
git remote add upstream https://github.com/kittyapol/ncare.git
\`\`\`

### 2. Set Up Development Environment

\`\`\`bash
# Install dependencies
pnpm install

# Start development servers
docker-compose up -d
\`\`\`

### 3. Create a Branch

\`\`\`bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/bug-description
\`\`\`

## 📝 Making Changes

### Code Style

#### Python (Backend)

- Follow PEP 8 style guide
- Use Black for formatting: \`black .\`
- Use Ruff for linting: \`ruff check .\`
- Type hints required for all functions
- Docstrings for public functions

#### TypeScript (Frontend)

- Follow the existing code style
- Use ESLint: \`pnpm lint\`
- Type everything (no \`any\` types)
- Use functional components with hooks
- Component names in PascalCase

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

**Types:**
- \`feat\`: New feature
- \`fix\`: Bug fix
- \`docs\`: Documentation only
- \`style\`: Code style (formatting, missing semicolons)
- \`refactor\`: Code change that neither fixes a bug nor adds a feature
- \`test\`: Adding or updating tests
- \`chore\`: Maintenance tasks

**Examples:**
\`\`\`
feat(pos): add barcode scanning support

Add barcode scanning capability to POS interface using Quagga.js library.
Supports EAN-13 and Code-128 formats.

Closes #123
\`\`\`

\`\`\`
fix(inventory): correct expiry date calculation

Fixed FEFO logic to properly handle timezone differences.

Fixes #456
\`\`\`

### Testing

- **Backend**: Write pytest tests for new features
- **Frontend**: Write Vitest tests for components
- All tests must pass before submitting PR

\`\`\`bash
# Run all tests
pnpm test

# Run backend tests with coverage
cd services/api && pytest --cov

# Run frontend tests
cd apps/web && pnpm test
\`\`\`

## 🔄 Submitting Changes

### 1. Update Your Branch

\`\`\`bash
# Fetch latest changes
git fetch upstream

# Rebase on upstream/main
git rebase upstream/main
\`\`\`

### 2. Push Changes

\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

### 3. Create Pull Request

- Go to GitHub and create a Pull Request
- Fill in the PR template completely
- Link related issues
- Request review from maintainers

### PR Checklist

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
- [ ] Commit messages follow convention

## 🧪 Testing Guidelines

### Backend Tests

\`\`\`python
# Test file: tests/backend/test_feature.py
import pytest
from app.models import Product

def test_product_creation():
    \"\"\"Test product creation with valid data\"\"\"
    product = Product(
        sku="TEST001",
        name_th="สินค้าทดสอบ",
        cost_price=100.00
    )
    assert product.sku == "TEST001"
    assert product.name_th == "สินค้าทดสอบ"
\`\`\`

### Frontend Tests

\`\`\`typescript
// Test file: src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react'
import Button from '../Button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
\`\`\`

## 📚 Documentation

- Update README.md for major features
- Add JSDoc/Docstring for new functions
- Update API documentation in docs/
- Add examples for new features

## 🐛 Reporting Bugs

### Before Reporting

- Check existing issues
- Try to reproduce on latest version
- Gather system information

### Bug Report Template

\`\`\`markdown
**Describe the bug**
Clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Ubuntu 22.04]
 - Browser: [e.g. Chrome 120]
 - Version: [e.g. 1.0.0]

**Additional context**
Any other information.
\`\`\`

## 💡 Feature Requests

### Template

\`\`\`markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
Clear description of what you want.

**Describe alternatives you've considered**
Alternative solutions or features.

**Additional context**
Screenshots, mockups, or examples.
\`\`\`

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for contributor badge

## 📞 Getting Help

- 💬 GitHub Discussions for questions
- 🐛 GitHub Issues for bugs
- 📧 Email: dev@ncare-pharmacy.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to NCare Pharmacy ERP! 🎉
