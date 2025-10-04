import { inject, Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked, Tokens } from 'marked';
import hljs from 'highlight.js/lib/common';

@Pipe({
  name: 'markdownToHtml'
})
export class MarkdownToHtmlPipe implements PipeTransform {

  readonly sanitizer = inject(DomSanitizer);

  constructor() {
    // Configure marked renderer for syntax highlighting
    const renderer = new marked.Renderer();

    renderer.code = function(token: Tokens.Code): string {
      const code = token.text;
      const lang = token.lang;

      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(code, { language: lang }).value;
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        } catch {
          // Fallback to auto-detection if specified language fails
        }
      }
      // Auto-detect language
      const highlighted = hljs.highlightAuto(code).value;
      return `<pre><code class="hljs">${highlighted}</code></pre>`;
    };

    // Configure marked options
    marked.setOptions({
      renderer,
      breaks: true,  // Convert \n to <br>
      gfm: true,     // GitHub Flavored Markdown
      pedantic: false
    });
  }

  transform(value: string): any {
    if (!value) {
      return value;
    }

    try {
      const html = marked.parse(value) as string;
      return this.sanitizer.sanitize(SecurityContext.HTML, html);
    } catch (error) {
      // Fallback to original value if parsing fails
      console.error('Markdown parsing error:', error);
      return this.sanitizer.sanitize(SecurityContext.HTML, value);
    }
  }
}
