import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Flight Reservations component (list + concierge chat)
 */
export class FlightReservationsPage {
  readonly page: Page;
  readonly toggleSidenavButton: Locator;
  readonly reservationRows: Locator;
  readonly refreshButton: Locator;
  readonly selectButtons: Locator;
  readonly conciergeMessageInput: Locator;
  readonly conciergeSendButton: Locator;
  readonly conciergeMessages: Locator;
  readonly conciergeUserMessages: Locator;
  readonly conciergeAssistantMessages: Locator;
  readonly conciergeValidationError: Locator;
  readonly conciergeCharacterCounter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toggleSidenavButton = page.locator('button[aria-label="Toggle concierge chat"]');
    this.reservationRows = page.locator('table.reservations-table tbody tr');
    this.refreshButton = page.locator('button[aria-label="Refresh reservations"]');
    this.selectButtons = page.locator('button[aria-label="Select reservation"]');
    this.conciergeMessageInput = page.locator('app-concierge-chat textarea[matInput]');
    this.conciergeSendButton = page.locator('button[aria-label="Send message"]');
    this.conciergeMessages = page.locator('app-concierge-chat .message');
    this.conciergeUserMessages = page.locator('app-concierge-chat .message-user');
    this.conciergeAssistantMessages = page.locator('app-concierge-chat .message-assistant');
    this.conciergeValidationError = page.locator('app-concierge-chat mat-error');
    this.conciergeCharacterCounter = page.locator('app-concierge-chat mat-hint.mat-mdc-form-field-hint-end');
  }

  async goto() {
    await this.page.goto('/flight-reservations');
  }

  async selectReservationByNumber(number: string) {
    const row = this.page.locator('table.reservations-table tbody tr', { hasText: number });
    await row.locator('button[aria-label="Select reservation"]').click();
  }

  async typeConciergeMessage(message: string) {
    await this.conciergeMessageInput.fill(message);
  }

  async sendConciergeMessage(message: string) {
    await this.typeConciergeMessage(message);
    await this.conciergeSendButton.click();
  }

  async getLastConciergeAssistantMessage(): Promise<string> {
    const messages = await this.conciergeAssistantMessages.all();
    if (messages.length === 0) return '';
    return await messages[messages.length - 1].locator('.message-content').textContent() || '';
  }

  async getLastConciergeUserMessage(): Promise<string> {
    const messages = await this.conciergeUserMessages.all();
    if (messages.length === 0) return '';
    return await messages[messages.length - 1].locator('.message-content').textContent() || '';
  }
}
