import {EventListenerCollection} from '../common/event-listener-collection';
import {querySelectorNotNull} from '../dom/query-selectors';
import {Application} from './application';

export class UIController {
  private readonly eventListeners = new EventListenerCollection();

  constructor(
    private readonly application: Application,
  ) {
  }

  prepare(): void {
    const onButtonClick = this.onButtonClick.bind(this);
    const buttons = document.querySelectorAll<HTMLElement>('[data-action]');
    for (const button of buttons) {
      this.eventListeners.addEventListener(button, 'click', onButtonClick);
    }
    // TODO : set first selected button and remove from html
  }

  dispose(): void {
    this.eventListeners.clear();
  }

  onButtonClick(event: MouseEvent): void {
    const element = event.currentTarget;
    if (!(element instanceof HTMLElement)) { return; }
    const {action} = element.dataset;
    if (typeof action !== 'string') { return; }
    // TODO : cache these instead?
    const targetElement = querySelectorNotNull<HTMLElement>(document, `#${action}`);
    // TODO : figure out why smoothing is not working (likely to do with css issues)
    targetElement.scrollIntoView({behavior: 'smooth', block: 'start'});
    // TODO : set on scroll as well
    element.dataset.selected = '';
    // TODO : remove last selected button
  }
}
