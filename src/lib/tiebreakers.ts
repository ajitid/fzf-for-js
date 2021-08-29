import type { FzfResultItem, Selector } from "./types";

export function byLengthAsc<U>(
  a: FzfResultItem<U>,
  b: FzfResultItem<U>,
  selector: Selector<U>
): number {
  return selector(a.item).length - selector(b.item).length;
}

export function byStartAsc<U>(
  a: FzfResultItem<U>,
  b: FzfResultItem<U>
): number {
  return a.start - b.start;
}
