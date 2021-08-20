import type { FzfResultItem, Options } from "./types";

export function byLengthAsc<U>(
  a: FzfResultItem<U>,
  b: FzfResultItem<U>,
  selector: Options<U>["selector"]
): number {
  return selector(a.item).length - selector(b.item).length;
}

export function byStartAsc<U>(
  a: FzfResultItem<U>,
  b: FzfResultItem<U>
): number {
  return a.start - b.start;
}
