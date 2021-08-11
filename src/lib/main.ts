import { Finder } from "./finder";
import type { ArrayElement, OptionsTuple, OptsToUse } from "./finder";
import type { Options } from "./types";

export type { Tiebreaker, FzfResultItem } from "./types";
export * from "./matchers";
export * from "./tiebreakers";

export type FzfOptions<U = string> = U extends string
  ? OptsToUse<U>
  : OptsToUse<U> & { selector: Options<U>["selector"] };

export class Fzf<L extends any[]> {
  private finder: Finder<L>;
  find: Finder<L>["find"];

  constructor(list: L, ...optionsTuple: OptionsTuple<ArrayElement<L>>) {
    this.finder = new Finder(list, ...optionsTuple);
    this.find = this.finder.find.bind(this.finder);
  }
}
