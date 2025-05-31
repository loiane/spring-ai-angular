import { inject, Pipe, PipeTransform, Sanitizer, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'markdownToHtml'
})
export class MarkdownToHtmlPipe implements PipeTransform {

  readonly sanitizer = inject(DomSanitizer);

  transform(value: string): any {
    if (!value) {
      return value;
    }
    let formatted = value
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/^### (.*$)/gm, '<strong>$1</strong>');
    return this.sanitizer.sanitize(SecurityContext.HTML, formatted);
  }
}
