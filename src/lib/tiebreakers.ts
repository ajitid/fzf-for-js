import type { Options } from "./main";
import type { FzfResultEntry } from "./types";

function byLengthAsc<U>(
  a: FzfResultEntry<U>,
  b: FzfResultEntry<U>,
  opts: Options<U>
): number {
  return opts.selector(a.item).length - opts.selector(b.item).length;
}

function byStartAsc<U>(a: FzfResultEntry<U>, b: FzfResultEntry<U>): number {
  return a.start - b.start;
}

export const tiebreakers = { byLengthAsc, byStartAsc };
