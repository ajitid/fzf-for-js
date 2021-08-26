import { Finder, AsyncFinder } from "./finders";
import type {
  ArrayElement,
  OptionsTuple,
  OptsToUse,
  AsyncOptionsTuple,
  AsyncOptsToUse,
} from "./finders";
import type { Options, AsyncOptions } from "./types";

export type { FzfResultItem, Selector, Tiebreaker } from "./types";
export * from "./matchers";
export * from "./tiebreakers";

export type FzfOptions<U = string> = U extends string
  ? OptsToUse<U>
  : OptsToUse<U> & { selector: Options<U>["selector"] };

export class Fzf<L extends ReadonlyArray<any>> {
  private finder: Finder<L>;
  find: Finder<L>["find"];

  constructor(list: L, ...optionsTuple: OptionsTuple<ArrayElement<L>>) {
    this.finder = new Finder(list, ...optionsTuple);
    this.find = this.finder.find.bind(this.finder);
  }
}

export type AsyncFzfOptions<U = string> = U extends string
  ? AsyncOptsToUse<U>
  : AsyncOptsToUse<U> & { selector: AsyncOptions<U>["selector"] };

export class AsyncFzf<L extends ReadonlyArray<any>> {
  private finder: AsyncFinder<L>;
  find: AsyncFinder<L>["find"];

  constructor(list: L, ...optionsTuple: AsyncOptionsTuple<ArrayElement<L>>) {
    this.finder = new AsyncFinder(list, ...optionsTuple);
    this.find = this.finder.find.bind(this.finder);
  }
}
