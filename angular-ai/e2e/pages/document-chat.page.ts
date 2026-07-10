import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Chat with Documents component
 */
export class DocumentChatPage {
  readonly page: Page;
  readonly uploadButton: Locator;
  readonly fileInput: Locator;
  readonly documentsMenuButton: Locator;
  readonly documentChip: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly validationError: Locator;
  readonly chatMessages: Locator;
  readonly userMessages: Locator;
  readonly aiMessages: Locator;
  readonly loadingIndicator: Locator;
  readonly sources: Locator;

  constructor(page: Page) {
    this.page = page;
    this.uploadButton = page.locator('button[aria-label="Upload PDF"]');
    this.fileInput = page.locator('input[type="file"]');
    this.documentsMenuButton = page.locator('button[aria-label="Documents"]');
    this.documentChip = page.locator('mat-chip');
    this.messageInput = page.locator('input[matInput]');
    this.sendButton = page.locator('button[aria-label="Send"]');
    this.validationError = page.locator('mat-error');
    this.chatMessages = page.locator('.message');
    this.userMessages = page.locator('.message-bubble.user');
    this.aiMessages = page.locator('.message-bubble:not(.user)');
    this.loadingIndicator = page.locator('.typing');
    this.sources = page.locator('.source');
  }

  async goto() {
    await this.page.goto('/chat-with-document');
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
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

  async openDocumentsMenu() {
    await this.documentsMenuButton.click();
  }
}
