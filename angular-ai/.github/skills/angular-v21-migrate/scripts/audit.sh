#!/usr/bin/env bash
# Angular v21 Migration Audit Script
# Checks a project for zone.js, Jasmine/Karma remnants, and migration readiness.
# Usage: bash audit.sh [project-root]
# If no project root is provided, uses the current directory.

set -euo pipefail

ROOT="${1:-.}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${BOLD}=== Angular v21 Migration Audit ===${NC}"
echo -e "Project root: ${CYAN}$(cd "$ROOT" && pwd)${NC}"
echo ""

ISSUES=0
WARNINGS=0

info()  { echo -e "  ${CYAN}ℹ${NC}  $1"; }
ok()    { echo -e "  ${GREEN}✓${NC}  $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC}  $1"; WARNINGS=$((WARNINGS + 1)); }
issue() { echo -e "  ${RED}✗${NC}  $1"; ISSUES=$((ISSUES + 1)); }

# --- Angular Version ---
echo -e "${BOLD}1. Angular Version${NC}"
if [[ -f "$ROOT/package.json" ]]; then
  CORE_VER=$(grep -o '"@angular/core": *"[^"]*"' "$ROOT/package.json" | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "")
  if [[ -n "$CORE_VER" ]]; then
    MAJOR=$(echo "$CORE_VER" | cut -d. -f1)
    if [[ "$MAJOR" -ge 21 ]]; then
      ok "@angular/core v${CORE_VER} (v21+ ✓)"
    else
      issue "@angular/core v${CORE_VER} — must be v21+ for this migration"
    fi
  else
    warn "Could not detect @angular/core version"
  fi
else
  issue "No package.json found at $ROOT"
fi
echo ""

# --- zone.js ---
echo -e "${BOLD}2. zone.js${NC}"

# Check package.json dependency
if grep -q '"zone.js"' "$ROOT/package.json" 2>/dev/null; then
  issue "zone.js found in package.json dependencies — needs removal"
else
  ok "zone.js not in package.json"
fi

# Check angular.json polyfills
if [[ -f "$ROOT/angular.json" ]]; then
  if grep -q '"zone.js"' "$ROOT/angular.json"; then
    issue "zone.js found in angular.json polyfills — needs removal"
  else
    ok "No zone.js in angular.json polyfills"
  fi
fi

# Check source imports
ZONE_IMPORTS=$(grep -rn "import.*zone.js" --include="*.ts" "$ROOT/src/" 2>/dev/null || true)
if [[ -n "$ZONE_IMPORTS" ]]; then
  issue "zone.js imports found in source files:"
  echo "$ZONE_IMPORTS" | while read -r line; do echo "       $line"; done
else
  ok "No zone.js imports in source files"
fi

# Check for provideZonelessChangeDetection
if grep -rq "provideZonelessChangeDetection" --include="*.ts" "$ROOT/src/" 2>/dev/null; then
  ok "provideZonelessChangeDetection() is configured"
else
  if grep -rq "provideZoneChangeDetection" --include="*.ts" "$ROOT/src/" 2>/dev/null; then
    issue "Still using provideZoneChangeDetection() — switch to provideZonelessChangeDetection()"
  else
    warn "Neither provideZoneChangeDetection nor provideZonelessChangeDetection found"
  fi
fi

# Check for NgZone usage
NGZONE_USAGE=$(grep -rn "NgZone\|\.zone\." --include="*.ts" "$ROOT/src/" 2>/dev/null | grep -v "spec.ts" | grep -v "node_modules" || true)
if [[ -n "$NGZONE_USAGE" ]]; then
  warn "NgZone references found (may need cleanup):"
  echo "$NGZONE_USAGE" | head -5 | while read -r line; do echo "       $line"; done
fi
echo ""

# --- Jasmine/Karma ---
echo -e "${BOLD}3. Jasmine / Karma${NC}"

# Karma config files
KARMA_FILES=$(find "$ROOT" -maxdepth 1 -name "karma.conf.*" 2>/dev/null || true)
if [[ -n "$KARMA_FILES" ]]; then
  issue "Karma config file(s) found: $KARMA_FILES"
else
  ok "No karma.conf file"
fi

# Karma in angular.json
if [[ -f "$ROOT/angular.json" ]]; then
  if grep -q "karma" "$ROOT/angular.json"; then
    issue "Karma references in angular.json — test builder needs replacement"
  else
    ok "No Karma references in angular.json"
  fi
fi

# Jasmine types in tsconfig
if [[ -f "$ROOT/tsconfig.spec.json" ]]; then
  if grep -q '"jasmine"' "$ROOT/tsconfig.spec.json"; then
    issue "Jasmine types in tsconfig.spec.json — needs removal"
  else
    ok "No Jasmine types in tsconfig.spec.json"
  fi
fi

# Karma/Jasmine packages
KARMA_PKGS=""
for pkg in karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core @types/jasmine; do
  if grep -q "\"$pkg\"" "$ROOT/package.json" 2>/dev/null; then
    KARMA_PKGS="$KARMA_PKGS $pkg"
  fi
done
if [[ -n "$KARMA_PKGS" ]]; then
  issue "Karma/Jasmine packages still installed:${KARMA_PKGS}"
else
  ok "No Karma/Jasmine packages in package.json"
fi

# ng test scripts
if grep -q '"ng test' "$ROOT/package.json" 2>/dev/null; then
  warn "package.json scripts reference 'ng test' (Karma) — update to Vitest"
fi
echo ""

# --- Vitest ---
echo -e "${BOLD}4. Vitest Readiness${NC}"

if grep -q '"vitest"' "$ROOT/package.json" 2>/dev/null; then
  ok "Vitest is installed"
else
  info "Vitest not yet installed"
fi

if grep -q '"@analogjs/vitest-angular"' "$ROOT/package.json" 2>/dev/null; then
  ok "@analogjs/vitest-angular is installed"
else
  info "@analogjs/vitest-angular not yet installed"
fi

if [[ -f "$ROOT/vitest.config.ts" ]] || [[ -f "$ROOT/vitest.config.mts" ]]; then
  ok "Vitest config file exists"
else
  info "No vitest.config.ts found"
fi

if [[ -f "$ROOT/tsconfig.spec.json" ]] && grep -q '"vitest/globals"' "$ROOT/tsconfig.spec.json" 2>/dev/null; then
  ok "vitest/globals in tsconfig.spec.json types"
else
  info "vitest/globals not in tsconfig.spec.json"
fi

# Count spec files
SPEC_COUNT=$(find "$ROOT/src" -name "*.spec.ts" 2>/dev/null | wc -l | tr -d ' ')
info "${SPEC_COUNT} spec files found to migrate"

# Check for Jasmine-specific syntax in spec files
JASMINE_SYNTAX=$(grep -rn "jasmine\.\|spyOn(" --include="*.spec.ts" "$ROOT/src/" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$JASMINE_SYNTAX" -gt 0 ]]; then
  info "${JASMINE_SYNTAX} lines with Jasmine-specific syntax (spyOn, jasmine.*) need conversion"
fi
echo ""

# --- Summary ---
echo -e "${BOLD}=== Summary ===${NC}"
if [[ $ISSUES -eq 0 && $WARNINGS -eq 0 ]]; then
  echo -e "  ${GREEN}All checks passed — project is ready or already migrated!${NC}"
elif [[ $ISSUES -eq 0 ]]; then
  echo -e "  ${YELLOW}${WARNINGS} warning(s), 0 blocking issues${NC}"
else
  echo -e "  ${RED}${ISSUES} issue(s)${NC}, ${YELLOW}${WARNINGS} warning(s)${NC}"
  echo -e "  Run the migration phases to resolve issues."
fi
echo ""
