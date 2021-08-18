import type { FzfResultItem, Options } from "./types";

export function byLengthAsc<U>(
  a: FzfResultItem<U>,
  b: FzfResultItem<U>,
  opts: Options<U>
): number {
  return opts.selector(a.item).trim().length - opts.selector(b.item).trim().length;
}

export function byStartAsc<U>(
  a: FzfResultItem<U>,
  b: FzfResultItem<U>
): number {
  return a.start - b.start;
}
