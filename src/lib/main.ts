import { SyncFinder, AsyncFinder } from "./finders";
import type {
  ArrayElement,
  SyncOptionsTuple,
  SyncOptsToUse,
  AsyncOptionsTuple,
  AsyncOptsToUse,
} from "./finders";
import type { SyncOptions, AsyncOptions } from "./types";
import { basicMatch } from "./matchers";

export type { FzfResultItem, Selector, Tiebreaker } from "./types";
export * from "./matchers";
export * from "./tiebreakers";

export type FzfOptions<U = string> = U extends string
  ? SyncOptsToUse<U>
  : SyncOptsToUse<U> & { selector: SyncOptions<U>["selector"] };

export class Fzf<L extends ReadonlyArray<any>> {
  private finder: SyncFinder<L>;
  find: SyncFinder<L>["find"];

  constructor(list: L, ...optionsTuple: SyncOptionsTuple<ArrayElement<L>>) {
    this.finder = new SyncFinder(list, ...optionsTuple);
    this.find = this.finder.find.bind(this.finder);
  }
}

// TODO async finder?
// fzf group or fzf multi
// recipe for findInOne (basically what fuzzysort and match-sorter do when asked to search in multiple keys)
type BaseOptionsWithoutSelector = never; // match will be Sync match and will be forced spread
type BaseOptionsWithoutLimitButWeightIncludedAndLimitInfinity = never; // for selectors
// how to handle array of string in data object

export class FzfMulti<
  L extends ReadonlyArray<any>,
  Options extends FzfOptions<ArrayElement<L>>
> {
  private fzfList: { finder: Fzf<L>; weight: number }[] = [];
  private list: L;

  constructor(
    list: L,
    getters: (Partial<Omit<Options, "limit" | "match" | "sort">> & {
      selector: Options["selector"];
      // TODO renaming it to interval makes more sense
      weight: number;
    })[],
    commonOptions: Partial<
      Omit<FzfOptions<ArrayElement<L>>, "selector" | "match">
    > = {}
  ) {
    this.list = list;

    for (const getter of getters) {
      const finder = new Fzf(list, {
        ...commonOptions,
        ...getter,
        match: basicMatch,
        sort: false,
        limit: Infinity,
        // TODO remove any type
      } as any);
      this.fzfList.push({ finder, weight: getter.weight });
    }
  }

  private getResultForSubstring(term: string) {
    const resultMap = new Map<ArrayElement<L>, number>();
    for (const fzf of this.fzfList) {
      const entries = fzf.finder.find(term);
      entries.forEach((entry) => {
        const score = resultMap.get(entry.item);
        if (score === undefined) {
          resultMap.set(entry.item, entry.score * fzf.weight);
        } else {
          resultMap.set(entry.item, score + entry.score * fzf.weight);
        }

        /*
        ^^ to hook in above
        const calculateScore = (item, previousScore: undefined becomes zero, currentScore, currentWeight, selector) {
          return newScore
        }
        */
      });
    }

    // TODO won't be a stable sort as same item might not be in result of first finder but is
    // present in second one
    return resultMap.keys();
  }

  find(query: string) {
    const terms = query.split(" ");

    const result = terms.reduceRight((data, term) => {
      const partialResultIterator = this.getResultForSubstring(term);
      const partialResultArray = Array.from(partialResultIterator);
      return partialResultArray;
    }, this.list as unknown as ArrayElement<L>[] /* <- TODO */);

    // TODO get sort info from common options and sort result items, apply limit here too.
    // ^ use defaultOptions spread
    // get highlight char info
    return result;
  }
}

const fzf = new FzfMulti(
  [
    { name: "Ajit", age: 27, groups: ["a", "b", "x"] },
    { name: "Sanjay", age: 12, groups: ["a", "b", "x"] },
    { name: "Tom", age: 23, groups: ["a", "b", "x"] },
  ],
  [
    { selector: (v) => v.name, weight: 1 },
    { selector: (v) => v.age.toString(), weight: 0.7 },
  ],
  {}
);

function select(data: object) {
  // @ts-ignore
  return [data["one"], data.two.three];
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
