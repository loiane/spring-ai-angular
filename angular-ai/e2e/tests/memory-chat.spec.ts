import { test, expect } from '@playwright/test';
import { MemoryChatPage } from '../pages/memory-chat.page';
import fixtures from '../fixtures/memory-chat-responses.json';

function sseBody(deltas: string[]): string {
  return deltas
    .map(delta => `event: message\ndata: ${JSON.stringify({ content: delta, type: 'ASSISTANT' })}\n\n`)
    .join('');
}

test.describe('Memory Chat - Session Management', () => {
  let chatPage: MemoryChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new MemoryChatPage(page);

    await page.route('**/api/chat-memory', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fixtures.chats),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should load the memory chat page with chat list', async () => {
    await chatPage.goto();
    await expect(chatPage.page).toHaveTitle(/AI-Spring-Angular/);
    await expect(chatPage.newChatButton).toBeVisible();
    await expect(chatPage.chatListItems.first()).toBeVisible();
  });

  test('should list existing chats by description', async () => {
    await chatPage.goto();
    for (const chat of fixtures.chats) {
      await expect(chatPage.page.locator('mat-list-item', { hasText: chat.description })).toBeVisible();
    }
  });

  test('should show empty state when no chats exist', async ({ page }) => {
    await page.route('**/api/chat-memory', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await chatPage.goto();
    await expect(chatPage.page.getByText('No chats available')).toBeVisible();
  });

  test('should select an existing chat and load its history', async ({ page }) => {
    await page.route(`**/api/chat-memory/${fixtures.chats[0].id}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures.history),
      });
    });

    await chatPage.goto();
    await chatPage.selectChatByDescription(fixtures.chats[0].description);
    await expect(chatPage.aiMessages.first()).toBeVisible();

    const lastAiMsg = await chatPage.getLastAiMessage();
    expect(lastAiMsg).toContain(fixtures.history[1].content);
  });

  test('should clear selection when clicking New chat', async ({ page }) => {
    await page.route(`**/api/chat-memory/${fixtures.chats[0].id}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures.history),
      });
    });

    await chatPage.goto();
    await chatPage.selectChatByDescription(fixtures.chats[0].description);
    await expect(chatPage.aiMessages.first()).toBeVisible();

    await chatPage.newChatButton.click();
    await expect(chatPage.chatMessages).toHaveCount(0);
  });
});

test.describe('Memory Chat - Conversation Flow', () => {
  let chatPage: MemoryChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new MemoryChatPage(page);

    await page.route('**/api/chat-memory', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await chatPage.goto();
  });

  test('should enable send button only with valid input', async () => {
    await expect(chatPage.sendButton).toBeHidden();
    await chatPage.typeMessage(fixtures.startChat.userMessage);
    await expect(chatPage.sendButton).toBeVisible();
    await expect(chatPage.sendButton).toBeEnabled();
  });

  test('should cap input at the character limit', async () => {
    const longMessage = 'a'.repeat(2001);
    await chatPage.typeMessage(longMessage);

    const counter = await chatPage.characterCounter.textContent();
    expect(counter).toContain('2000/2000');
  });

  test('should start a new chat and stream the assistant response', async ({ page }) => {
    await page.route('**/api/chat-memory/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chatId: fixtures.startChat.chatId,
          message: fixtures.startChat.aiResponseDelta,
          description: fixtures.startChat.description,
        }),
      });
    });

    await page.route(`**/api/chat-memory/${fixtures.startChat.chatId}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { content: fixtures.startChat.userMessage, type: 'USER' },
          { content: fixtures.startChat.aiResponseDelta, type: 'ASSISTANT' },
        ]),
      });
    });

    await chatPage.sendMessage(fixtures.startChat.userMessage);
    await page.waitForTimeout(300);

    const lastUserMsg = await chatPage.getLastUserMessage();
    expect(lastUserMsg).toContain(fixtures.startChat.userMessage);
  });

  test('should continue an existing chat and stream deltas', async ({ page }) => {
    await page.route(`**/api/chat-memory/${fixtures.chats[0].id}`, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fixtures.history),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/api/chat-memory/${fixtures.chats[0].id}/stream`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseBody([fixtures.continueChat.aiResponseDelta]),
      });
    });

    await page.route('**/api/chat-memory', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtures.chats) });
      } else {
        await route.continue();
      }
    });

    await chatPage.goto();
    await chatPage.selectChatByDescription(fixtures.chats[0].description);
    await chatPage.sendMessage(fixtures.continueChat.userMessage);
    await page.waitForTimeout(500);

    const lastAiMsg = await chatPage.getLastAiMessage();
    expect(lastAiMsg).toContain(fixtures.continueChat.aiResponseDelta);
  });

  test('should clear input after sending message', async ({ page }) => {
    await page.route('**/api/chat-memory/start', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chatId: fixtures.startChat.chatId,
          message: fixtures.startChat.aiResponseDelta,
          description: fixtures.startChat.description,
        }),
      });
    });

    await page.route(`**/api/chat-memory/${fixtures.startChat.chatId}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { content: fixtures.startChat.userMessage, type: 'USER' },
          { content: fixtures.startChat.aiResponseDelta, type: 'ASSISTANT' },
        ]),
      });
    });

    await chatPage.sendMessage(fixtures.startChat.userMessage);
    await page.waitForTimeout(300);

    const inputValue = await chatPage.messageInput.inputValue();
    expect(inputValue).toBe('');
  });
});
