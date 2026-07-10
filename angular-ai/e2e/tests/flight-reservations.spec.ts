import { test, expect } from '@playwright/test';
import { FlightReservationsPage } from '../pages/flight-reservations.page';
import fixtures from '../fixtures/flight-data.json';

function sseBody(deltas: string[]): string {
  return deltas
    .map(delta => `event: message\ndata: ${JSON.stringify({ content: delta, type: 'ASSISTANT' })}\n\n`)
    .join('');
}

test.describe('Flight Reservations - Listing', () => {
  let reservationsPage: FlightReservationsPage;

  test.beforeEach(async ({ page }) => {
    reservationsPage = new FlightReservationsPage(page);

    await page.route('**/api/flight-reservations', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fixtures.reservations),
        });
      } else {
        await route.continue();
      }
    });

    await reservationsPage.goto();
  });

  test('should load the flight reservations page with a list of bookings', async () => {
    await expect(reservationsPage.page).toHaveTitle(/AI-Spring-Angular/);
    await expect(reservationsPage.reservationRows).toHaveCount(fixtures.reservations.length);
  });

  test('should display reservation details in the table', async ({ page }) => {
    const first = fixtures.reservations[0];
    await expect(page.getByText(first.reservationId)).toBeVisible();
    await expect(page.getByText(`${first.passengerFirstName} ${first.passengerLastName}`)).toBeVisible();
    await expect(page.getByText(first.departureAirport)).toBeVisible();
    await expect(page.getByText(first.arrivalAirport)).toBeVisible();
  });

  test('should refresh the reservations list', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/flight-reservations', async route => {
      if (route.request().method() === 'GET') {
        requestCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fixtures.reservations),
        });
      } else {
        await route.continue();
      }
    });

    await reservationsPage.refreshButton.click();
    await page.waitForTimeout(300);
    expect(requestCount).toBeGreaterThan(0);
  });

  test('should select a reservation from the list', async () => {
    await reservationsPage.selectReservationByNumber(fixtures.reservations[0].reservationId);
    const row = reservationsPage.page.locator('table.reservations-table tbody tr', {
      hasText: fixtures.reservations[0].reservationId,
    });
    await expect(row).toHaveClass(/selected-row/);
  });

  test('should show empty state when there are no reservations', async ({ page }) => {
    await page.route('**/api/flight-reservations', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await reservationsPage.goto();
    await expect(reservationsPage.reservationRows).toHaveCount(0);
  });
});

test.describe('Flight Reservations - Concierge Chat', () => {
  let reservationsPage: FlightReservationsPage;

  test.beforeEach(async ({ page }) => {
    reservationsPage = new FlightReservationsPage(page);

    await page.route('**/api/flight-reservations', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fixtures.reservations),
        });
      } else {
        await route.continue();
      }
    });

    await reservationsPage.goto();
  });

  test('should show the initial greeting message', async ({ page }) => {
    await expect(page.locator('app-concierge-chat')).toContainText('SpringFly Concierge');
    await expect(page.locator('app-concierge-chat')).toContainText('How can I assist you');
  });

  test('should send a concierge message and stream the assistant response', async ({ page }) => {
    await page.route('**/api/concierge/stream', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseBody([fixtures.conciergeResponseDelta]),
      });
    });

    await reservationsPage.sendConciergeMessage(fixtures.conciergeMessage);
    await page.waitForTimeout(500);

    const lastUserMsg = await reservationsPage.getLastConciergeUserMessage();
    expect(lastUserMsg).toContain(fixtures.conciergeMessage);

    const lastAssistantMsg = await reservationsPage.getLastConciergeAssistantMessage();
    expect(lastAssistantMsg).toContain(fixtures.conciergeResponseDelta);
  });

  test('should cap concierge input at the character limit', async () => {
    const longMessage = 'a'.repeat(2001);
    await reservationsPage.typeConciergeMessage(longMessage);

    const counter = await reservationsPage.conciergeCharacterCounter.textContent();
    expect(counter).toContain('2000/2000');
  });

  test('should handle concierge stream error gracefully', async ({ page }) => {
    await page.route('**/api/concierge/stream', async route => {
      await route.abort('failed');
    });

    await reservationsPage.sendConciergeMessage(fixtures.conciergeMessage);
    await page.waitForTimeout(500);

    const lastAssistantMsg = await reservationsPage.getLastConciergeAssistantMessage();
    expect(lastAssistantMsg).toContain('trouble connecting');
  });

  test('should toggle the concierge sidenav', async ({ page }) => {
    await expect(page.locator('app-concierge-chat')).toBeVisible();
    await reservationsPage.toggleSidenavButton.click();
    await expect(page.locator('mat-sidenav.concierge-sidenav')).not.toHaveClass(/mat-drawer-opened/);
  });
});
