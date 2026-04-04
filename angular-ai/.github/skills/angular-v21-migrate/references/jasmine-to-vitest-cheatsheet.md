# Jasmine → Vitest Cheatsheet

Quick reference for converting Angular test files from Jasmine to Vitest syntax.

## Identical API (No Changes Needed)

These work the same in both Jasmine and Vitest:

| API | Notes |
|-----|-------|
| `describe('...', () => {})` | Test suite |
| `it('...', () => {})` | Test case |
| `beforeEach(() => {})` | Setup |
| `afterEach(() => {})` | Teardown |
| `beforeAll(() => {})` | One-time setup |
| `afterAll(() => {})` | One-time teardown |
| `expect(value).toBe(x)` | Strict equality |
| `expect(value).toEqual(x)` | Deep equality |
| `expect(value).toBeTruthy()` | Truthy check |
| `expect(value).toBeFalsy()` | Falsy check |
| `expect(value).toBeDefined()` | Defined check |
| `expect(value).toBeNull()` | Null check |
| `expect(value).toContain(x)` | Contains check |
| `expect(value).toBeGreaterThan(x)` | Comparison |
| `expect(value).toThrow()` | Error thrown |
| `expect(value).toHaveBeenCalled()` | Spy was called |
| `expect(value).toHaveBeenCalledWith(...)` | Spy call args |
| `expect(value).toHaveBeenCalledTimes(n)` | Spy call count |

## Spies — Must Change

### Creating Spies

```typescript
// Jasmine
const spy = jasmine.createSpy('myFn');
const spy = jasmine.createSpy('myFn').and.returnValue('hello');

// Vitest
const spy = vi.fn();
const spy = vi.fn().mockReturnValue('hello');
```

### Spy on Object Methods

```typescript
// Jasmine
spyOn(service, 'method');
spyOn(service, 'method').and.returnValue('value');
spyOn(service, 'method').and.callThrough();
spyOn(service, 'method').and.callFake(() => 'fake');
spyOn(service, 'method').and.throwError('err');

// Vitest
vi.spyOn(service, 'method');
vi.spyOn(service, 'method').mockReturnValue('value');
vi.spyOn(service, 'method');                           // callThrough is default
vi.spyOn(service, 'method').mockImplementation(() => 'fake');
vi.spyOn(service, 'method').mockImplementation(() => { throw new Error('err'); });
```

### Spy on Properties

```typescript
// Jasmine
spyOnProperty(service, 'prop', 'get').and.returnValue('val');

// Vitest
vi.spyOn(service, 'prop', 'get').mockReturnValue('val');
```

### Spy Objects (createSpyObj)

```typescript
// Jasmine
const mockService = jasmine.createSpyObj('MyService', ['method1', 'method2']);
mockService.method1.and.returnValue('value');

// Vitest — create manually
const mockService = {
  method1: vi.fn().mockReturnValue('value'),
  method2: vi.fn(),
};
```

### Spy Type Annotations

```typescript
// Jasmine
let spy: jasmine.Spy;
let spyObj: jasmine.SpyObj<MyService>;

// Vitest
import { type MockInstance } from 'vitest';
let spy: MockInstance;
// No direct SpyObj equivalent, use a typed mock object
let spyObj: { method1: MockInstance; method2: MockInstance };
```

### Resetting Spies

```typescript
// Jasmine
spy.calls.reset();

// Vitest
spy.mockReset();   // resets implementation + call history
spy.mockClear();   // resets call history only
```

### Checking Spy Calls

```typescript
// Jasmine
spy.calls.count();
spy.calls.mostRecent();
spy.calls.argsFor(0);
spy.calls.allArgs();

// Vitest
spy.mock.calls.length;
spy.mock.lastCall;
spy.mock.calls[0];
spy.mock.calls;
```

## Async Patterns

```typescript
// Jasmine — done callback
it('async test', (done) => {
  service.getData().subscribe(data => {
    expect(data).toBe('value');
    done();
  });
});

// Vitest — same pattern works, but prefer async/await
it('async test', async () => {
  const data = await firstValueFrom(service.getData());
  expect(data).toBe('value');
});
```

For Angular v21 `@angular/build:unit-test`, avoid callback parameter style (`(done) => {}`) because it can be typed as `TestContext` and fail compilation. Prefer `async/await` or fake timers.

## Timers

```typescript
// Jasmine
jasmine.clock().install();
jasmine.clock().tick(1000);
jasmine.clock().uninstall();

// Vitest
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();
```

## Fail a Test Explicitly

```typescript
// Jasmine
fail('should not reach here');

// Vitest (option 1 — recommended)
expect.unreachable('should not reach here');

// Vitest (option 2)
throw new Error('should not reach here');
```

## Pending / Skip / Focus

```typescript
// Jasmine
xit('skipped test', () => {});
fdescribe('focused suite', () => {});
fit('focused test', () => {});
pending('reason');

// Vitest
it.skip('skipped test', () => {});
describe.only('focused suite', () => {});
it.only('focused test', () => {});
it.skip('reason', () => {});    // or it.todo('reason')
```

## Angular TestBed — No Changes Needed

TestBed works identically with Vitest via `@analogjs/vitest-angular`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
    imports: [MyComponent],
  });
});
```

## Angular HTTP Testing — No Changes Needed

```typescript
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  httpMock = TestBed.inject(HttpTestingController);
});
```

## Regex Patterns for Bulk Find-and-Replace

Use these with your editor's regex search (or `sed`/`perl`) for bulk conversions:

| Find (regex) | Replace |
|---|---|
| `jasmine\.createSpy\(([^)]*)\)` | `vi.fn()` |
| `spyOn\(` | `vi.spyOn(` |
| `spyOnProperty\(([^,]+),\s*([^,]+),\s*([^)]+)\)` | `vi.spyOn($1, $2, $3)` |
| `\.and\.returnValue\(` | `.mockReturnValue(` |
| `\.and\.callFake\(` | `.mockImplementation(` |
| `\.and\.callThrough\(\)` | `` (remove entirely) |
| `\.and\.throwError\((['"])(.*?)\1\)` | `.mockImplementation(() => { throw new Error($1$2$1); })` |
| `\.calls\.reset\(\)` | `.mockReset()` |
| `jasmine\.Spy\b` | `MockInstance` |
| `jasmine\.SpyObj<([^>]+)>` | `{ [key: string]: MockInstance }` |
| `jasmine\.clock\(\)\.install\(\)` | `vi.useFakeTimers()` |
| `jasmine\.clock\(\)\.tick\(` | `vi.advanceTimersByTime(` |
| `jasmine\.clock\(\)\.uninstall\(\)` | `vi.useRealTimers()` |
| `\bfail\(` | `expect.unreachable(` |
| `\bxit\(` | `it.skip(` |
| `\bfdescribe\(` | `describe.only(` |
| `\bfit\(` | `it.only(` |
