import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Memory Chat component
 */
export class MemoryChatPage {
  readonly page: Page;
  readonly newChatButton: Locator;
  readonly chatListItems: Locator;
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
    this.newChatButton = page.locator('button[aria-label="Create new chat"]');
    this.chatListItems = page.locator('mat-nav-list mat-list-item');
    this.messageInput = page.locator('input[matInput]');
    this.sendButton = page.locator('button[aria-label="Send"]');
    this.characterCounter = page.locator('mat-hint.mat-mdc-form-field-hint-end');
    this.validationError = page.locator('mat-error');
    this.chatMessages = page.locator('.message');
    this.userMessages = page.locator('.message-bubble.user');
    this.aiMessages = page.locator('.message-bubble:not(.user)');
    this.loadingIndicator = page.locator('.typing');
  }

  async goto() {
    await this.page.goto('/memory-chat');
  }

  async selectChatByDescription(description: string) {
    await this.page.locator('mat-list-item', { hasText: description }).click();
  }

  async deleteChatByDescription(description: string) {
    await this.page
      .locator('mat-list-item', { hasText: description })
      .locator('button')
      .click();
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
}
