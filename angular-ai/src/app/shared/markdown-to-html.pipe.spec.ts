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
    expect(result).toContain('<b>bold text</b>');
  });

  it('should convert multiple **text** to bold', () => {
    const input = '**first** and **second**';
    const result = pipe.transform(input);
    expect(result).toContain('<b>first</b>');
    expect(result).toContain('<b>second</b>');
  });

  it('should convert ### heading to strong', () => {
    const input = '### This is a heading';
    const result = pipe.transform(input);
    expect(result).toContain('<strong>This is a heading</strong>');
  });

  it('should handle mixed markdown syntax', () => {
    const input = '### Heading\n\nSome **bold** text';
    const result = pipe.transform(input);
    expect(result).toContain('<strong>Heading</strong>');
    expect(result).toContain('<b>bold</b>');
  });

  it('should handle text without markdown', () => {
    const input = 'Just plain text';
    const result = pipe.transform(input);
    expect(result).toBe('Just plain text');
  });

  it('should sanitize the output', () => {
    const input = '**test** <script>alert("xss")</script>';
    const result = pipe.transform(input);
    expect(result).toContain('<b>test</b>');
    // The script tag should be sanitized out
    expect(result).not.toContain('<script>');
  });
});
