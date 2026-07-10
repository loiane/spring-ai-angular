import { test, expect } from '@playwright/test';
import path from 'path';
import { DocumentChatPage } from '../pages/document-chat.page';
import fixtures from '../fixtures/document-responses.json';

const SAMPLE_PDF = path.join(__dirname, '..', 'fixtures', 'sample.pdf');

function sseBody(answerDeltas: string[], sources: unknown[]): string {
  const answerFrames = answerDeltas
    .map(delta => `event: answer\ndata: ${JSON.stringify(delta)}\n\n`)
    .join('');
  const sourcesFrame = `event: sources\ndata: ${JSON.stringify(sources)}\n\n`;
  return answerFrames + sourcesFrame;
}

test.describe('Chat with Documents - Upload Flow', () => {
  let docPage: DocumentChatPage;

  test.beforeEach(async ({ page }) => {
    docPage = new DocumentChatPage(page);

    await page.route('**/api/rag/documents', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await docPage.goto();
  });

  test('should load the document chat page', async () => {
    await expect(docPage.page).toHaveTitle(/AI-Spring-Angular/);
    await expect(docPage.uploadButton).toBeVisible();
    await expect(docPage.messageInput).toBeDisabled();
  });

  test('should upload a PDF and become ready to chat', async ({ page }) => {
    await page.route('**/api/rag/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures.document),
      });
    });

    await docPage.uploadFile(SAMPLE_PDF);
    await page.waitForTimeout(300);

    await expect(docPage.documentChip).toContainText(fixtures.document.filename);
    await expect(docPage.messageInput).toBeEnabled();
  });

  test('should poll processing status until document is ready', async ({ page }) => {
    await page.route('**/api/rag/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures.processingDocument),
      });
    });

    await page.route(`**/api/rag/documents/${fixtures.processingDocument.id}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures.document),
      });
    });

    await docPage.uploadFile(SAMPLE_PDF);
    await page.waitForTimeout(2500);

    await expect(docPage.messageInput).toBeEnabled();
  });

  test('should show an error message when document processing fails', async ({ page }) => {
    await page.route('**/api/rag/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures.errorDocument),
      });
    });

    await docPage.uploadFile(SAMPLE_PDF);
    await page.waitForTimeout(300);

    const lastAiMsg = await docPage.getLastAiMessage();
    expect(lastAiMsg).toContain(fixtures.errorDocument.filename);
  });

  test('should handle upload API failure gracefully', async ({ page }) => {
    await page.route('**/api/rag/upload', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Internal Server Error"}' });
    });

    await docPage.uploadFile(SAMPLE_PDF);
    await page.waitForTimeout(300);

    const lastAiMsg = await docPage.getLastAiMessage();
    expect(lastAiMsg).toContain('upload failed');
    await expect(docPage.messageInput).toBeDisabled();
  });
});

test.describe('Chat with Documents - Ask Questions', () => {
  let docPage: DocumentChatPage;

  test.beforeEach(async ({ page }) => {
    docPage = new DocumentChatPage(page);

    await page.route('**/api/rag/documents', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([fixtures.document]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/rag/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures.document),
      });
    });

    await docPage.goto();
    await docPage.uploadFile(SAMPLE_PDF);
    await docPage.page.waitForTimeout(300);
  });

  test('should ask a question and stream the answer with sources', async ({ page }) => {
    await page.route('**/api/rag/ask/stream', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseBody([fixtures.answerDelta], fixtures.sources),
      });
    });

    await docPage.sendMessage(fixtures.question);
    await page.waitForTimeout(500);

    const lastUserMsg = await docPage.getLastUserMessage();
    expect(lastUserMsg).toContain(fixtures.question);

    const lastAiMsg = await docPage.getLastAiMessage();
    expect(lastAiMsg).toContain(fixtures.answerDelta);
    await expect(docPage.sources.first()).toBeVisible();
  });

  test('should select a different document from the documents menu', async ({ page }) => {
    await page.route('**/api/rag/documents', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([fixtures.document, fixtures.processingDocument]),
        });
      } else {
        await route.continue();
      }
    });

    await docPage.openDocumentsMenu();
    await expect(page.locator('mat-list-item', { hasText: fixtures.document.filename })).toBeVisible();
  });

  test('should handle ask API error gracefully', async ({ page }) => {
    await page.route('**/api/rag/ask/stream', async route => {
      await route.abort('failed');
    });

    await docPage.sendMessage(fixtures.question);
    await page.waitForTimeout(500);

    const lastAiMsg = await docPage.getLastAiMessage();
    expect(lastAiMsg).toContain('unable to process');
  });
});
