---
name: angular-v21-migrate
description: "Migrate Angular projects to v21+: remove zone.js, remove Jasmine/Karma, migrate tests to Vitest, enable zoneless change detection. Use when: upgrading Angular, removing zone.js, replacing Karma with Vitest, converting Jasmine tests to Vitest, Angular v21 migration, zoneless Angular."
argument-hint: "Specify what to migrate: 'all', 'remove-zonejs', 'remove-karma', 'migrate-vitest', or 'audit'"
---

# Angular v21 Migration — Remove zone.js, Jasmine/Karma → Vitest

Automates the key breaking changes and modernization steps when upgrading an Angular project to v21+.

## When to Use

- Upgrading an Angular project to v21 or later
- Removing zone.js from an existing Angular app
- Replacing Jasmine/Karma test runner with Vitest
- Converting Jasmine test syntax to Vitest
- Auditing a project for migration readiness

## Scope

This skill handles three independent migration tracks that can be run individually or together:

1. **Remove zone.js** — switch to `provideZonelessChangeDetection()`
2. **Remove Jasmine/Karma** — uninstall packages, remove config files, clean angular.json
3. **Migrate to Vitest** — install Vitest, configure it for Angular, convert test files

## Prerequisites

- Angular CLI v21+ installed (`ng version`)
- Project already updated to Angular v21 packages (`ng update`)
- All existing tests pass before migration (run them first)

---

## Procedure

### Phase 0 — Audit

Before making changes, audit the project to understand what needs migration.

1. Run [the audit script](./scripts/audit.sh) or perform these checks manually:
   - Check `package.json` for `zone.js`, `karma`, `jasmine-core`, `@types/jasmine`, `karma-*` packages
   - Check `angular.json` for `@angular/build:karma` test builder
   - Check `tsconfig.spec.json` for `"types": ["jasmine"]`
   - Check `src/main.ts` and `src/polyfills.ts` for `import 'zone.js'`
   - Check `app.config.ts` for `provideZoneChangeDetection()` vs `provideZonelessChangeDetection()`
   - Count `.spec.ts` files to estimate test migration effort
   - Check for `karma.conf.js` or `karma.conf.ts` at project root
2. Report findings before proceeding

### Phase 1 — Remove zone.js

Follow the [zone.js removal checklist](./references/remove-zonejs.md):

1. **Switch to zoneless change detection** in `app.config.ts`:
   - Replace `provideZoneChangeDetection({ eventCoalescing: true })` with `provideZonelessChangeDetection()`
   - Import `provideZonelessChangeDetection` from `@angular/core`
   - Remove the `provideZoneChangeDetection` import if no longer used
2. **Remove zone.js from polyfills** in `angular.json`:
   - In `architect.build.options`, remove `"zone.js"` from the `polyfills` array
   - In `architect.test.options`, remove `"zone.js"` and `"zone.js/testing"` from the `polyfills` array
3. **Remove zone.js import** from `src/main.ts` or `src/polyfills.ts` if present
4. **Uninstall zone.js**:
   ```bash
   npm uninstall zone.js
   ```
5. **Update all test files** — add `provideZonelessChangeDetection()` to `TestBed.configureTestingModule` providers if not already present
6. **Verify** — build and run tests to confirm nothing breaks

### Phase 2 — Remove Jasmine/Karma

Follow the [Karma removal checklist](./references/remove-karma.md):

1. **Delete config files**:
   - `karma.conf.js` or `karma.conf.ts` (if they exist)
2. **Replace the Karma test architect target** in `angular.json`:
   - Remove `@angular/build:karma`
   - Add `"test": { "builder": "@angular/build:unit-test" }`
3. **Clean `tsconfig.spec.json`**:
   - Remove `"jasmine"` from `compilerOptions.types`
   - Keep the file for Angular unit-test builder and update it in Phase 3
4. **Uninstall Jasmine/Karma packages**:
   ```bash
   npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core @types/jasmine
   ```
5. **Remove test scripts** from `package.json` that reference `ng test` or `karma`

### Phase 3 — Migrate to Vitest

Follow the [Vitest migration guide](./references/migrate-vitest.md):

1. **Install Vitest dependencies**:
   ```bash
    npm install -D vitest jsdom
   ```
2. **Use Angular's built-in unit test builder** (no `vitest.config.ts` required):
    - In `angular.json`, set:
    ```json
    {
       "test": {
          "builder": "@angular/build:unit-test"
       }
    }
    ```
3. **Update `tsconfig.spec.json`** to Angular v21 pattern:
   - Set types to include vitest globals:
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
4. **Update `package.json` scripts**:
   ```json
   {
       "test": "ng test",
       "test:ci": "ng test --watch=false --progress=false"
   }
   ```
5. **Convert test files** — apply syntax transformations from the [Jasmine-to-Vitest cheatsheet](./references/jasmine-to-vitest-cheatsheet.md):
   - Replace `jasmine.Spy` → `vi.SpyInstance` (or use `MockInstance` type)
   - Replace `spyOn(obj, 'method')` → `vi.spyOn(obj, 'method')`
   - Replace `jasmine.createSpy('name')` → `vi.fn()`
   - Replace `jasmine.createSpyObj('name', ['m1', 'm2'])` → manual mock object with `vi.fn()`
   - Replace `.and.returnValue(x)` → `.mockReturnValue(x)`
   - Replace `.and.callFake(fn)` → `.mockImplementation(fn)`
   - Replace `.and.callThrough()` → (default behavior in Vitest, remove the call)
   - Replace `.toHaveBeenCalledTimes(n)` → same (compatible)
   - Replace `.toHaveBeenCalledWith(...)` → same (compatible)
   - Replace `fail('msg')` → `expect.unreachable('msg')` or `throw new Error('msg')`
   - Replace `done` callbacks with `async/await` or fake timers (`vi.useFakeTimers`) to avoid `TestContext` callback typing issues
   - `describe`, `it`, `expect`, `beforeEach`, `afterEach` — same API, no changes needed
   - Keep `TestBed` imports as-is
6. **Run tests**:
   ```bash
   npm test
   ```

### Phase 4 — Final Verification

1. `npm run build` — production build must succeed
2. `npm test` — all tests pass with Vitest
3. `npm run e2e` — end-to-end tests still pass (if applicable)
4. Verify no references to `zone.js`, `karma`, or `jasmine` remain in source files:
   ```bash
   grep -r "zone.js\|karma\|jasmine" --include="*.ts" --include="*.json" --include="*.js" src/ *.json *.js 2>/dev/null
   ```
5. Review `package.json` — no leftover Karma/Jasmine/zone.js dependencies

---

## Common Gotchas

- **`fixture.detectChanges()` in zoneless mode**: Still works but change detection is triggered by signals. Manual `detectChanges()` may still be needed in tests.
- **`fakeAsync` / `async`**: These utilities from `@angular/core/testing` still work with `provideZonelessChangeDetection()` in tests.
- **Third-party libraries depending on zone.js**: Check if any imported libraries rely on Zone.js patching (e.g., some older Material components). Angular Material v21+ is fully zoneless-compatible.
- **`HttpClientTestingModule` is deprecated**: Use `provideHttpClient()` + `provideHttpClientTesting()` with `HttpTestingController` instead.
- **Test files with `jasmine.clock()`**: Replace with `vi.useFakeTimers()` / `vi.useRealTimers()`.
- **`done` callback parameter errors (`TestContext` has no call signatures)**: Replace callback-style tests with `async/await` (`firstValueFrom`) or fake timers.
