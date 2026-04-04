# Remove zone.js — Checklist

Step-by-step checklist for removing zone.js from an Angular v21+ project.

## Pre-flight

- [ ] Confirm Angular v21+ (`ng version`)
- [ ] All tests pass before changes (`npm test`)
- [ ] App builds cleanly (`npm run build`)

## 1. Switch to Zoneless Change Detection

**File: `src/app/app.config.ts`** (or wherever `ApplicationConfig` is defined)

Before:
```typescript
import { provideZoneChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // ...
  ]
};
```

After:
```typescript
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // ...
  ]
};
```

## 2. Remove zone.js from angular.json Polyfills

**File: `angular.json`**

Remove `"zone.js"` from build polyfills:
```json
"architect": {
  "build": {
    "options": {
      "polyfills": []  // remove "zone.js" entry
    }
  }
}
```

Remove `"zone.js"` and `"zone.js/testing"` from test polyfills:
```json
"architect": {
  "test": {
    "options": {
      "polyfills": []  // remove "zone.js" and "zone.js/testing"
    }
  }
}
```

> **Note**: If `polyfills` array is empty after removal, you can remove the entire `polyfills` key, or leave it as an empty array.

## 3. Remove zone.js Imports from Source Files

Check and remove from:
- `src/main.ts` — remove `import 'zone.js';`
- `src/polyfills.ts` — remove `import 'zone.js';` (file may not exist in newer projects)
- `src/test.ts` — remove `import 'zone.js/testing';` (file may not exist in newer projects)

## 4. Uninstall zone.js Package

```bash
npm uninstall zone.js
```

## 5. Update Test Files

Every `TestBed.configureTestingModule` call should include `provideZonelessChangeDetection()`:

```typescript
import { provideZonelessChangeDetection } from '@angular/core';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
    // ...
  });
});
```

Search for test files missing this provider:
```bash
# Find spec files that use TestBed but don't have provideZonelessChangeDetection
grep -rL "provideZonelessChangeDetection" --include="*.spec.ts" src/ | \
  xargs grep -l "TestBed" 2>/dev/null
```

## 6. Check for Zone.js-Dependent Patterns

Search for patterns that may need updates:

```bash
# Direct zone.js references
grep -rn "zone\.js\|Zone\.\|NgZone" --include="*.ts" src/

# NgZone injection (may need removal or replacement)
grep -rn "private.*zone.*NgZone\|inject(NgZone)" --include="*.ts" src/
```

**Common NgZone patterns to replace:**

| Before (with NgZone) | After (zoneless) |
|---|---|
| `this.zone.run(() => { ... })` | Remove wrapper — code runs directly |
| `this.zone.runOutsideAngular(() => { ... })` | Remove wrapper — no zones to escape |
| `constructor(private zone: NgZone)` | Remove injection |

## 7. Verify

```bash
npm run build          # production build
npm test               # unit tests
npm run e2e            # e2e tests (if applicable)
```

Check no zone.js references remain:
```bash
grep -rn "zone.js" --include="*.ts" --include="*.json" src/ angular.json package.json
```
