# Migrate to Vitest — Guide

Complete guide for setting up Vitest as the test runner in an Angular v21+ project.

## Prerequisites

- Jasmine/Karma already removed (see [remove-karma.md](./remove-karma.md))
- Angular v21+ with `@angular/build` package installed

## 1. Install Dependencies

```bash
npm install -D vitest @analogjs/vitest-angular jsdom
```

Optional (for coverage and UI):
```bash
npm install -D @vitest/coverage-v8 @vitest/ui
```

## 2. Vitest Config {#vitest-config}

**Create `vitest.config.ts`** at the project root:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vitest-angular/vite';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/*.routes.ts',
        'src/app/**/index.ts',
        'src/main.ts',
      ],
    },
  },
});
```

## 3. Test Setup File

**Create `src/test-setup.ts`**:

```typescript
import '@analogjs/vitest-angular/setup-zone';
```

> This initializes the Angular testing environment for Vitest. Despite the name, this does NOT add zone.js — it sets up Angular's `TestBed` and testing utilities to work with Vitest.

## 4. Update tsconfig.spec.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts"]
}
```

## 5. Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ci": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## 6. Convert Test Files

### Automatic (regex-based)

See the [Jasmine-to-Vitest cheatsheet](./jasmine-to-vitest-cheatsheet.md) for regex patterns.

Quick sed commands for bulk conversion (macOS):
```bash
# Replace spyOn with vi.spyOn
find src -name "*.spec.ts" -exec sed -i '' 's/spyOn(/vi.spyOn(/g' {} +

# Replace jasmine.createSpy
find src -name "*.spec.ts" -exec sed -i '' 's/jasmine\.createSpy([^)]*)/vi.fn()/g' {} +

# Replace .and.returnValue
find src -name "*.spec.ts" -exec sed -i '' 's/\.and\.returnValue(/\.mockReturnValue(/g' {} +

# Replace .and.callFake
find src -name "*.spec.ts" -exec sed -i '' 's/\.and\.callFake(/\.mockImplementation(/g' {} +

# Replace .and.callThrough() (remove it — default in Vitest)
find src -name "*.spec.ts" -exec sed -i '' 's/\.and\.callThrough()//g' {} +

# Replace jasmine.Spy type
find src -name "*.spec.ts" -exec sed -i '' 's/jasmine\.Spy/MockInstance/g' {} +

# Replace fail()
find src -name "*.spec.ts" -exec sed -i '' 's/\bfail(/expect.unreachable(/g' {} +

# Replace jasmine.clock
find src -name "*.spec.ts" -exec sed -i '' \
  -e 's/jasmine\.clock()\.install()/vi.useFakeTimers()/g' \
  -e 's/jasmine\.clock()\.tick(/vi.advanceTimersByTime(/g' \
  -e 's/jasmine\.clock()\.uninstall()/vi.useRealTimers()/g' {} +
```

Linux variant (use `-i` without `''`):
```bash
find src -name "*.spec.ts" -exec sed -i 's/spyOn(/vi.spyOn(/g' {} +
# ... same patterns
```

### Manual Review Required

After bulk conversion, review these patterns manually:

1. **`jasmine.createSpyObj`** — no direct equivalent; create mock objects with `vi.fn()`:
   ```typescript
   // Before
   const mock = jasmine.createSpyObj('Service', ['get', 'post']);
   
   // After
   const mock = { get: vi.fn(), post: vi.fn() };
   ```

2. **Spy call inspection** (`.calls.mostRecent()`, `.calls.argsFor()`, etc.) — see cheatsheet

3. **`done` callbacks** — convert to async/await where possible

4. **Add `MockInstance` import** if `jasmine.Spy` type was used:
   ```typescript
   import { type MockInstance } from 'vitest';
   ```

## 7. Verify Tests Run

```bash
# Run all tests
npm test

# Run in watch mode during migration
npm run test:watch

# Check coverage
npm run test:ci
```

## 8. Clean Up

- Delete `coverage/` directory (Vitest uses a different output path by default)
- Update `.gitignore` if needed (Vitest coverage goes to `coverage/` by default too)
- Remove any `src/test.ts` or Karma-specific test bootstrap files

## Common Issues

### "Cannot find module '@analogjs/vitest-angular'"
Ensure `@analogjs/vitest-angular` is installed and `vitest.config.ts` is at the project root.

### "TestBed is not configured"
Make sure `src/test-setup.ts` exists and is referenced in `vitest.config.ts` → `test.setupFiles`.

### "zone.js is not loaded"
If you see this, the test-setup file is not being loaded. Verify `setupFiles` path in `vitest.config.ts`.

### Tests hang or timeout
Check for tests that use `done` callback but never call `done()`. Convert to async/await.

### "vi is not defined"
Ensure `globals: true` in `vitest.config.ts` and `"types": ["vitest/globals"]` in `tsconfig.spec.json`.
