import type { Options } from "./main";
import type { FzfResultItem } from "./types";

function byLengthAsc<U>(
  a: FzfResultItem<U>,
  b: FzfResultItem<U>,
  opts: Options<U>
): number {
  return opts.selector(a.item).length - opts.selector(b.item).length;
}

function byStartAsc<U>(a: FzfResultItem<U>, b: FzfResultItem<U>): number {
  return a.start - b.start;
}

export const tiebreakers = { byLengthAsc, byStartAsc };
