import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MarkdownToHtmlPipe } from './markdown-to-html.pipe';

describe('MarkdownToHtmlPipe', () => {
  let pipe: MarkdownToHtmlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MarkdownToHtmlPipe
      ]
    });
    pipe = TestBed.inject(MarkdownToHtmlPipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return value if value is falsy', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe(null);
    expect(pipe.transform(undefined as any)).toBe(undefined);
  });

  it('should convert **text** to bold', () => {
    const input = '**bold text**';
    const result = pipe.transform(input);
    expect(result).toContain('<strong>bold text</strong>');
  });

  it('should convert multiple **text** to bold', () => {
    const input = '**first** and **second**';
    const result = pipe.transform(input);
    expect(result).toContain('<strong>first</strong>');
    expect(result).toContain('<strong>second</strong>');
  });

  it('should convert *text* to italic', () => {
    const input = '*italic text*';
    const result = pipe.transform(input);
    expect(result).toContain('<em>italic text</em>');
  });

  it('should convert ### heading to h3', () => {
    const input = '### This is a heading';
    const result = pipe.transform(input);
    expect(result).toContain('<h3>This is a heading</h3>');
  });

  it('should support multiple heading levels', () => {
    const input = '# H1\n## H2\n### H3';
    const result = pipe.transform(input);
    expect(result).toContain('<h1>H1</h1>');
    expect(result).toContain('<h2>H2</h2>');
    expect(result).toContain('<h3>H3</h3>');
  });

  it('should convert unordered lists', () => {
    const input = '- Item 1\n- Item 2\n- Item 3';
    const result = pipe.transform(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
    expect(result).toContain('</ul>');
  });

  it('should convert ordered lists', () => {
    const input = '1. First\n2. Second\n3. Third';
    const result = pipe.transform(input);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>First</li>');
    expect(result).toContain('<li>Second</li>');
    expect(result).toContain('</ol>');
  });

  it('should convert links', () => {
    const input = '[Angular](https://angular.dev)';
    const result = pipe.transform(input);
    expect(result).toContain('<a href="https://angular.dev">Angular</a>');
  });

  it('should convert inline code', () => {
    const input = 'Use the `console.log()` function';
    const result = pipe.transform(input);
    expect(result).toContain('<code>console.log()</code>');
  });

  it('should convert code blocks with syntax highlighting', () => {
    const input = '```typescript\nconst x = 42;\n```';
    const result = pipe.transform(input);
    expect(result).toContain('<pre><code class="hljs language-typescript">');
    expect(result).toContain('</code></pre>');
  });

  it('should convert code blocks without language specification', () => {
    const input = '```\nsome code\n```';
    const result = pipe.transform(input);
    expect(result).toContain('<pre><code class="hljs">');
    expect(result).toContain('</code></pre>');
  });

  it('should handle line breaks with breaks option', () => {
    const input = 'Line 1\nLine 2';
    const result = pipe.transform(input);
    expect(result).toContain('<br>');
  });

  it('should handle mixed markdown syntax', () => {
    const input = '### Heading\n\nSome **bold** text with a [link](https://example.com)';
    const result = pipe.transform(input);
    expect(result).toContain('<h3>Heading</h3>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<a href="https://example.com">link</a>');
  });

  it('should handle text without markdown', () => {
    const input = 'Just plain text';
    const result = pipe.transform(input);
    expect(result).toContain('Just plain text');
  });

  it('should sanitize the output', () => {
    // This test intentionally includes potentially malicious content to verify
    // that Angular's DomSanitizer properly strips it out. The warning message
    // "sanitizing HTML stripped some content" is EXPECTED behavior here.

    // Temporarily suppress console warnings for this test since sanitization warning is expected
    const originalWarn = console.warn;
    console.warn = jasmine.createSpy('warn');

    const input = '**test** <script>alert("xss")</script>';
    const result = pipe.transform(input);
    expect(result).toContain('<strong>test</strong>');
    // The script tag should be sanitized out by Angular's built-in XSS protection
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');

    // Restore console.warn
    console.warn = originalWarn;
  });

  it('should handle blockquotes', () => {
    const input = '> This is a quote';
    const result = pipe.transform(input);
    expect(result).toContain('<blockquote>');
    expect(result).toContain('This is a quote');
    expect(result).toContain('</blockquote>');
  });

  it('should handle tables', () => {
    const input = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
    const result = pipe.transform(input);
    expect(result).toContain('<table>');
    expect(result).toContain('<thead>');
    expect(result).toContain('<tbody>');
  });

  it('should handle code blocks with invalid language gracefully', () => {
    // Test the fallback to auto-detection when language highlighting fails
    const input = '```invalidlang123\nsome code\n```';
    const result = pipe.transform(input);
    // Should still generate code block even if language is invalid
    expect(result).toContain('<pre><code class="hljs">');
    expect(result).toContain('</code></pre>');
  });

  it('should handle mixed markdown with code blocks', () => {
    const input = '## Heading\n\n```javascript\nconst x = 1;\n```\n\nSome **bold** text';
    const result = pipe.transform(input);
    expect(result).toContain('<h2>Heading</h2>');
    expect(result).toContain('<pre><code class="hljs language-javascript">');
    expect(result).toContain('<strong>bold</strong>');
  });
});
