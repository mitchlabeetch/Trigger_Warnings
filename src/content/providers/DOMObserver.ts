
export class DOMObserver {
  private selector: string;
  private onElementChanged: (element: Element | null) => void;
  private observer: MutationObserver | null = null;
  private currentElement: Element | null = null;

  constructor(selector: string, onElementChanged: (element: Element | null) => void) {
    this.selector = selector;
    this.onElementChanged = onElementChanged;
  }

  public start(target: Node): void {
    if (this.observer) {
      this.stop();
    }

    this.observer = new MutationObserver(() => {
      this.checkForElement();
    });

    this.observer.observe(target, {
      childList: true,
      subtree: true,
    });

    this.checkForElement();
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.currentElement = null;
    }
  }

  private checkForElement(): void {
    const element = document.querySelector(this.selector);

    if (element !== this.currentElement) {
      this.currentElement = element;
      this.onElementChanged(this.currentElement);
    }
  }
}
