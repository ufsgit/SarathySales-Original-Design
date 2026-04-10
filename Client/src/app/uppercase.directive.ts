import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: 'input[type="text"], input:not([type]), textarea',
  standalone: true
})
export class UppercaseDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'text-transform', 'uppercase');
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    const originalValue = input.value;
    const uppercaseValue = originalValue.toUpperCase();

    if (originalValue !== uppercaseValue) {
      input.value = uppercaseValue;
      
      // Keep cursor position
      if (start !== null && end !== null) {
        input.setSelectionRange(start, end);
      }

      // Dispatch 'input' event to notify Angular/ngModel
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    const uppercaseValue = originalValue.toUpperCase();

    if (originalValue !== uppercaseValue) {
      input.value = uppercaseValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
