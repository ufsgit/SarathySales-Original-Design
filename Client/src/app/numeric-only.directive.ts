import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[numericOnly]',
  standalone: true
})
export class NumericOnlyDirective {
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^0-9]/g, '');

    if (input.value !== sanitized) {
      input.value = sanitized;
      const eventInput = new Event('input', { bubbles: true });
      input.dispatchEvent(eventInput);
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text/plain') ?? '';
    const sanitized = clipboardData.replace(/[^0-9]/g, '');
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    input.value = (input.value.slice(0, start) + sanitized + input.value.slice(end)).replace(/[^0-9]/g, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if (event.key && !/\d/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Tab' && event.key !== 'Enter') {
      event.preventDefault();
    }
  }
}
