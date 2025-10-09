import { test, expect } from '@playwright/test';
import { SimpleChatPage } from '../pages/simple-chat.page';
import chatResponses from '../fixtures/chat-responses.json';

test.describe('Simple Chat - Basic Flow', () => {
  let chatPage: SimpleChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new SimpleChatPage(page);

    // Mock API response
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: chatResponses.simpleChat.aiResponse,
        }),
      });
    });

    await chatPage.goto();
  });

  test('should load the simple chat page', async () => {
    await expect(chatPage.page).toHaveTitle(/AI-Spring-Angular/);
    await expect(chatPage.messageInput).toBeVisible();
    // Send button only appears when there's input
  });

  test('should have send button disabled when input is empty', async () => {
    // Send button is hidden when input is empty (conditionally rendered with @if)
    await expect(chatPage.sendButton).toBeHidden();
  });

  test('should enable send button when input has valid text', async () => {
    await chatPage.typeMessage(chatResponses.simpleChat.userMessage);
    await expect(chatPage.sendButton).toBeVisible();
    await expect(chatPage.sendButton).toBeEnabled();
  });

  test('should display character counter', async () => {
    await chatPage.typeMessage('Hello');
    const counter = await chatPage.getCharacterCount();
    expect(counter).toContain('5/2000');
  });

  test('should send message and display response', async ({ page }) => {
    const userMessage = chatResponses.simpleChat.userMessage;

    await chatPage.sendMessage(userMessage);

    // Wait for response
    await page.waitForTimeout(500);

    // Verify user message is displayed
    const lastUserMsg = await chatPage.getLastUserMessage();
    expect(lastUserMsg).toContain(userMessage);

    // Verify AI response is displayed
    const lastAiMsg = await chatPage.getLastAiMessage();
    expect(lastAiMsg).toContain(chatResponses.simpleChat.aiResponse);
  });

  test('should clear input after sending message', async ({ page }) => {
    await chatPage.sendMessage(chatResponses.simpleChat.userMessage);
    await page.waitForTimeout(500);

    const inputValue = await chatPage.messageInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should show validation error for too long message', async () => {
    const longMessage = 'a'.repeat(2001);
    await chatPage.typeMessage(longMessage);

    await expect(chatPage.sendButton).toBeVisible();
    await expect(chatPage.sendButton).toBeDisabled();
    await expect(chatPage.validationError).toBeVisible();
  });
});

test.describe('Simple Chat - Error Scenarios', () => {
  let chatPage: SimpleChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new SimpleChatPage(page);
    await chatPage.goto();
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
        }),
      });
    });

    await chatPage.sendMessage('Test message');
    await page.waitForTimeout(500);

    // Should still be able to interact with the chat
    await expect(chatPage.messageInput).toBeEnabled();
    // Send button will be hidden when input is empty after clearing
    await expect(chatPage.sendButton).toBeHidden();
  });

  test('should handle network timeout', async ({ page }) => {
    // Mock slow/timeout API response
    await page.route('**/api/chat', async (route) => {
      await page.waitForTimeout(10000); // Simulate timeout
      await route.abort('timedout');
    });

    await chatPage.sendMessage('Test message');

    // Should show loading state initially
    await expect(chatPage.loadingIndicator).toBeVisible();
  });
});
