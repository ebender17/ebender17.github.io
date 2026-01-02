import {SafeAny} from './types';

type EventListenerEntry = EventListenerEntry1;

type EventListenerEntry1 = {
  type: 'addEventListener';
  target: EventTargetWeb<string, SafeAny>;
  event: string;
  callback: EventHandler<SafeAny>;
  options: EventListenerOptions | boolean | undefined;
};

// TODO : add support for objects with 'on' and 'off' functions

type EventTargetWeb<TEventName, TEventType> = {
  addEventListener(type: TEventName, callback: EventHandler<TEventType> | null, options?: EventListenerOptions | boolean): void;
  removeEventListener(type: string, callback: EventHandler<SafeAny> | null, options?: EventListenerOptions | boolean): void;
};

type EventHandler<TEventType> = (
  | ((value: TEventType) => void)
  | ((value: TEventType) => Promise<void>)
);

export class EventListenerCollection {
  private readonly listeners: EventListenerEntry[] = [];

  addEventListener<
    TEventName extends string,
    TEventType,
    TTarget extends EventTargetWeb<TEventName, TEventType>,
  >(
    target: TTarget,
    event: TEventName,
    callback: EventHandler<TEventType>,
    options?: EventListenerOptions | boolean,
  ): void {
    target.addEventListener(event, callback, options);
    this.listeners.push({type: 'addEventListener', target, event, callback, options});
  }

  clear(): void {
    if (this.listeners.length === 0) { return; }
    for (const listener of this.listeners) {
      if (listener.type === 'addEventListener') {
        listener.target.removeEventListener(listener.event, listener.callback, listener.options);
        break;
      }
    }
    this.listeners.length = 0;
  }
}
