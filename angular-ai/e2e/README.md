# E2E Testing with Playwright

This directory contains end-to-end tests for the Angular AI application using Playwright.

## 📁 Structure

```
e2e/
├── fixtures/         # Mock data for tests
│   ├── chat-responses.json
│   └── flight-data.json
├── pages/           # Page Object Models
│   ├── simple-chat.page.ts
│   ├── memory-chat.page.ts (TODO)
└── tests/           # Test specifications
    ├── simple-chat.spec.ts
    ├── memory-chat.spec.ts (TODO)
    ├── error-scenarios.spec.ts (TODO)
    └── loading-states.spec.ts (TODO)
```

## 🚀 Running Tests

### Run all tests
```bash
npm run e2e
```

### Run tests in UI mode (interactive)
```bash
npm run e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run e2e:headed
```

### Debug tests
```bash
npm run e2e:debug
```

### View test report
```bash
npm run e2e:report
```

### Run specific test file
```bash
npx playwright test simple-chat.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 🎯 Test Coverage

### ✅ Implemented
- Simple Chat: Basic flow and validation
- Simple Chat: Error scenarios

### 🚧 TODO
- Memory Chat: Session management
- Memory Chat: Chat history
- Flight Reservation: Booking flow
- Flight Reservation: Cancellation
- Loading states across all components
- Network error handling
- Offline scenarios

## 📝 Writing Tests

### Page Object Model Pattern

Always use Page Object Models (POM) for better maintainability:

```typescript
// e2e/pages/my-component.page.ts
import { Page, Locator } from '@playwright/test';

export class MyComponentPage {
  readonly page: Page;
  readonly someButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someButton = page.getByRole('button', { name: /some button/i });
  }

  async goto() {
    await this.page.goto('/my-component');
  }

  async clickSomeButton() {
    await this.someButton.click();
  }
}
```

### Test Structure

```typescript
// e2e/tests/my-component.spec.ts
import { test, expect } from '@playwright/test';
import { MyComponentPage } from '../pages/my-component.page';

test.describe('My Component', () => {
  let page: MyComponentPage;

  test.beforeEach(async ({ page: playwright }) => {
    page = new MyComponentPage(playwright);

    // Mock API if needed
    await playwright.route('**/api/endpoint', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: 'mock' }),
      });
    });

    await page.goto();
  });

  test('should do something', async () => {
    await page.clickSomeButton();
    await expect(page.someButton).toBeVisible();
  });
});
```

## 🔍 Debugging Tips

### 1. Use UI Mode
```bash
npm run e2e:ui
```
This provides an interactive UI to run and debug tests.

### 2. Use Debug Mode
```bash
npm run e2e:debug
```
Opens Playwright Inspector for step-by-step debugging.

### 3. Take Screenshots
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### 4. Use Trace Viewer
Traces are automatically recorded on first retry. View them:
```bash
npx playwright show-trace trace.zip
```

### 5. Slow Motion
```typescript
test.use({ launchOptions: { slowMo: 1000 } });
```

## 🛠 Configuration

Configuration is in `playwright.config.ts`. Key settings:

- **baseURL**: `http://localhost:4200`
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

## 🌐 API Mocking

All tests use mocked API responses for:
- Fast execution
- Reliable tests
- No backend dependency
- Predictable responses

Mock data is in `e2e/fixtures/`.

Example:
```typescript
await page.route('**/api/chat', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ response: 'Mocked response' }),
  });
});
```

## 📊 CI/CD Integration

Tests run in GitHub Actions (when configured):
- Runs on Chrome, Firefox, Safari
- Uploads test artifacts
- Generates HTML report
- Creates JUnit XML for test reporting

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
