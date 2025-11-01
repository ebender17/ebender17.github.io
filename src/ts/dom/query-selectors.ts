export function querySelectorNotNull<T extends Element>(parent: ParentNode, selector: string): T {
  const result = parent.querySelector<T>(selector);
  if (result === null) { throw new Error(`Failed to find element using selector ${selector}`); }
  return result;
}
