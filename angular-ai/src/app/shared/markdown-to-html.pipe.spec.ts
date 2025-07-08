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
});
