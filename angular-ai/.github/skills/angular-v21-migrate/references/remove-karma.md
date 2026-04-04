# Remove Jasmine/Karma — Checklist

Step-by-step checklist for removing Jasmine and Karma from an Angular project.

## Pre-flight

- [ ] All tests recorded/documented (they will be migrated to Vitest in a separate phase)
- [ ] Confirm current test runner is Karma: check `angular.json` → `architect.test.builder` = `@angular/build:karma`

## 1. Delete Karma Config Files

Remove if they exist:
```bash
rm -f karma.conf.js karma.conf.ts
```

## 2. Replace Karma Test Target in angular.json

**File: `angular.json`**

Replace the Karma target with Angular's unit test builder:

```json
"architect": {
  "build": { ... },
  "serve": { ... },
  "test": {
    "builder": "@angular/build:unit-test"
  }
}
```

> **Important**: Do not leave the project without a `test` target.

## 3. Clean tsconfig.spec.json

**File: `tsconfig.spec.json`**

Remove `"jasmine"` from the `types` array:

Before:
```json
{
  "compilerOptions": {
    "types": ["jasmine"]
  }
}
```

After (temporary state before Vitest phase):
```json
{
  "compilerOptions": {
    "types": []
  }
}
```

> This file will be updated in the Vitest migration phase to include `"vitest/globals"`.

## 4. Remove Legacy Test Bootstrap File

If the project has a `src/test.ts` (test entry point for Karma), delete it:
```bash
rm -f src/test.ts
```

## 5. Uninstall Packages

```bash
npm uninstall \
  karma \
  karma-chrome-launcher \
  karma-coverage \
  karma-jasmine \
  karma-jasmine-html-reporter \
  jasmine-core \
  @types/jasmine
```

Other Karma plugins to check for and remove:
- `karma-firefox-launcher`
- `karma-spec-reporter`
- `karma-mocha-reporter`
- `karma-sourcemap-loader`
- `karma-webpack`

## 6. Update package.json Scripts

Remove old Karma-specific scripts and flags. Keep `ng test` scripts that do not reference browser flags:

```json
{
  "scripts": {
    "test": "ng test",                                     // keep
    "test:ci": "ng test --watch=false --progress=false"    // recommended
  }
}
```

These will be finalized in the Vitest migration phase.

## 7. Verify

```bash
# Build still works
npm run build

# No karma references remain
grep -rn "karma" --include="*.ts" --include="*.json" --include="*.js" . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=coverage

# No jasmine references in config files
grep -rn "jasmine" angular.json tsconfig*.json package.json 2>/dev/null
```

> **Note**: `.spec.ts` files will still contain Jasmine syntax (`describe`, `it`, `expect`, `spyOn`, etc.). That's expected — they will be converted in the Vitest migration phase. Most of `describe`/`it`/`expect` are API-compatible.
