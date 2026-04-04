# Migrate to Vitest — Guide (Angular v21 Unit-Test Builder)

Complete guide for setting up Vitest in Angular v21+ using the built-in `@angular/build:unit-test` builder.

## Prerequisites

- Jasmine/Karma already removed (see [remove-karma.md](./remove-karma.md))
- Angular v21+ with `@angular/build` package installed

## 1. Install Dependencies

```bash
npm install -D vitest jsdom
```

Optional (coverage/UI helpers):
```bash
npm install -D @vitest/coverage-v8 @vitest/ui
```

## 2. Configure angular.json Test Target

Use Angular's built-in unit test target.

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "test": {
          "builder": "@angular/build:unit-test"
        }
      }
    }
  }
}
```

> No `vitest.config.ts` or `src/test-setup.ts` is required for this setup.

## 3. Update tsconfig.spec.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.d.ts", "src/**/*.spec.ts"]
}
```

## 4. Update package.json Scripts

```json
{
  "scripts": {
    "test": "ng test",
    "test:ci": "ng test --watch=false --progress=false"
  }
}
```

## 5. Convert Test Files

### Automatic (regex-based)

See the [Jasmine-to-Vitest cheatsheet](./jasmine-to-vitest-cheatsheet.md) for regex patterns.

Quick bulk conversion (macOS):

```bash
find src -name "*.spec.ts" -exec perl -0pi -e 's/\bspyOn\(/vi.spyOn(/g; s/\bfail\(/expect.unreachable(/g; s/jasmine\.any\(/expect.any(/g;' {} +
find src -name "*.spec.ts" -exec sed -i '' 's/jasmine\.createSpy([^)]*)/vi.fn()/g' {} +
find src -name "*.spec.ts" -exec sed -i '' 's/\.and\.returnValue(/\.mockReturnValue(/g' {} +
find src -name "*.spec.ts" -exec sed -i '' 's/\.and\.callFake(/\.mockImplementation(/g' {} +
find src -name "*.spec.ts" -exec sed -i '' 's/\.and\.callThrough()//g' {} +
find src -name "*.spec.ts" -exec sed -i '' 's/jasmine\.Spy/ReturnType<typeof vi.spyOn>/g' {} +
```

### Manual Review Required

After bulk conversion, review these patterns manually:

1. `jasmine.createSpyObj` — no direct equivalent; replace with object literals and `vi.fn()`
2. `done` callback tests — convert to `async/await` (`firstValueFrom`) or `vi.useFakeTimers()`
3. `and.callThrough()` behavior — remove and verify tests still assert expected loading state
4. Any remaining `jasmine.` namespace usage

## 6. Verify

```bash
npm test
npm run test:ci
npm run build
```

## Common Issues

### "A DOM environment is required"
Install `jsdom`:

```bash
npm install -D jsdom
```

### `TS2349: TestContext has no call signatures` for `done()`
Vitest test callback parameter is typed as `TestContext`; avoid `done` callbacks. Use `async/await` or fake timers.

### `zone.js`-related setup errors
Do not add `@analogjs/vitest-angular/setup-zone` when using this builder-based setup.

### `spyOn` not found at runtime
Replace `spyOn(...)` with `vi.spyOn(...)`.
