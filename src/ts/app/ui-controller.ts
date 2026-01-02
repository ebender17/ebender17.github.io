import {EventListenerCollection} from '../common/event-listener-collection';
import {querySelectorNotNull} from '../dom/query-selectors';
import {Application} from './application';

type Section = {
  element: HTMLElement;
  button: HTMLButtonElement;
  action: string;
};

export class UIController {
  private readonly eventListeners = new EventListenerCollection();
  private readonly sections: Section[] = [];
  private readonly actionToSectionMap = new Map<string, Section>();
  private selectedSection: Section | null = null;

  constructor(
    private readonly application: Application,
  ) {
  }

  prepare(): void {
    const intersectionObserver = new IntersectionObserver(
      this.onIntersection.bind(this),
      {
        threshold: [0.9],
      },
    );

    const sections = document.querySelectorAll<HTMLElement>('.section');
    const buttons = document.querySelectorAll<HTMLButtonElement>('.controls-button[data-action]');
    if (sections.length !== buttons.length) {
      throw Error('Sections and corresponding buttons are not the same length');
    }

    for (let i = 0; i < sections.length; i++) {
      const element = sections[i];
      const button = buttons[i];
      const {action} = button.dataset;
      if (typeof action === 'undefined') {
        throw Error('No action set for a controls button');
      }
      if (element.id !== action) {
        throw Error('Section id and button action do not match');
      }
      intersectionObserver.observe(element);
      const section: Section = {element, button, action};
      this.eventListeners.addEventListener(button, 'click', this.onButtonClick.bind(this, section));
      this.sections.push(section);
      this.actionToSectionMap.set(action, section);
    }
    this.selectedSection = this.sections[0];
    this.selectedSection.button.dataset.selected = '';
  }

  dispose(): void {
    this.eventListeners.clear();
  }

  private onIntersection(entries: IntersectionObserverEntry[], _observer: IntersectionObserver): void {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio > 0.9) {
        const section = this.actionToSectionMap.get(entry.target.id);
        if (typeof section === 'undefined') {
          throw Error(`Could not find section ${entry.target.id} inside map`);
        }
        this.setSelectedSection(section);
      }
    }
  }

  private onButtonClick(section: Section): void {
    this.setSelectedSection(section);
    const targetElement = querySelectorNotNull<HTMLElement>(document, `#${section.action}`);
    targetElement.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  private setSelectedSection(section: Section): void {
    if (this.selectedSection) {
      if (this.selectedSection.action === section.action) { return; }
      delete this.selectedSection.button.dataset.selected;
      this.selectedSection = null;
    }
    this.selectedSection = section;
    this.selectedSection.button.dataset.selected = '';
  }
}
