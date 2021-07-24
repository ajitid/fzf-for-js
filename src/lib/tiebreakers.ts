import { FzfResultEntry } from "./types";

function byLengthAsc<U>(
  a: FzfResultEntry<U>,
  b: FzfResultEntry<U>,
  selector: (v: U) => string
): number {
  return selector(a.item).length - selector(b.item).length;
}

function byStartAsc<U>(
  a: FzfResultEntry<U>,
  b: FzfResultEntry<U>,
  selector: (v: U) => string
): number {
  return a.start - b.start;
}

export const tiebreakers = { byLengthAsc, byStartAsc };
