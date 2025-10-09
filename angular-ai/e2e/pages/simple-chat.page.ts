import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Simple Chat component
 */
export class SimpleChatPage {
  readonly page: Page;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly characterCounter: Locator;
  readonly validationError: Locator;
  readonly chatMessages: Locator;
  readonly userMessages: Locator;
  readonly aiMessages: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageInput = page.locator('input[matInput]');
    this.sendButton = page.locator('button[aria-label="Send"]');
    this.characterCounter = page.locator('mat-hint[align="end"]');
    this.validationError = page.locator('mat-error');
    this.chatMessages = page.locator('.message');
    this.userMessages = page.locator('.message-bubble.user');
    this.aiMessages = page.locator('.message-bubble:not(.user)');
    this.loadingIndicator = page.locator('.typing');
  }

  async goto() {
    await this.page.goto('/chat/simple');
  }

  async typeMessage(message: string) {
    await this.messageInput.fill(message);
  }

  async clickSend() {
    await this.sendButton.click();
  }

  async sendMessage(message: string) {
    await this.typeMessage(message);
    await this.clickSend();
  }

  async getCharacterCount(): Promise<string> {
    return await this.characterCounter.textContent() || '';
  }

  async getValidationError(): Promise<string | null> {
    if (await this.validationError.isVisible()) {
      return await this.validationError.textContent();
    }
    return null;
  }

  async getLastUserMessage(): Promise<string> {
    const messages = await this.userMessages.all();
    if (messages.length === 0) return '';
    return await messages[messages.length - 1].textContent() || '';
  }

  async getLastAiMessage(): Promise<string> {
    const messages = await this.aiMessages.all();
    if (messages.length === 0) return '';
    return await messages[messages.length - 1].textContent() || '';
  }

  async getMessageCount(): Promise<number> {
    return await this.chatMessages.count();
  }

  async isSendButtonDisabled(): Promise<boolean> {
    return await this.sendButton.isDisabled();
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible().catch(() => false);
  }

  async waitForResponse() {
    // Wait for loading indicator to appear and disappear
    await this.page.waitForTimeout(100);
    await this.loadingIndicator.waitFor({ state: 'visible' }).catch(() => {});
    await this.loadingIndicator.waitFor({ state: 'hidden' }).catch(() => {});
  }
}
