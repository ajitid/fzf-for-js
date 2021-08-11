import { fuzzyMatchV2, fuzzyMatchV1, AlgoFn, exactMatchNaive } from "./algo";
import { basicMatch } from "./matchers";
import { Rune, strToRunes } from "./runes";
import { FzfResultItem, Options } from "./types";

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type SortAttrs<U> =
  | {
      sort?: true;
      tiebreakers?: Options<U>["tiebreakers"];
    }
  | { sort: false };

export type OptsToUse<U> = Omit<Partial<Options<U>>, "sort" | "tiebreakers"> &
  SortAttrs<U>;

// from https://stackoverflow.com/a/52318137/7683365
export type OptionsTuple<U> = U extends string
  ? [options?: OptsToUse<U>]
  : [options: OptsToUse<U> & { selector: Options<U>["selector"] }];

const defaultOpts: Options<any> = {
  limit: Infinity,
  selector: (v) => v,
  casing: "smart-case",
  normalize: true,
  fuzzy: "v2",
  match: basicMatch,
  // example:
  // tiebreakers: [byLengthAsc, byStartAsc],
  tiebreakers: [],
  sort: true,
  forward: true,
};

/*
  This is actual FZF. You might ask, why not directly use this rather than
  creating a wrapper in `main` file? We aren't using this directly only because
  its attributes are not private. And the reason for them not being private is
  that we have an external function `match` to which we send `this` to. For
  `match` to use attributes of FZF, the attributes have to remain non-private.
*/
export class Finder<L extends ReadonlyArray<any>> {
  runesList: Rune[][];
  items: L;
  readonly opts: Options<ArrayElement<L>>;
  algoFn: AlgoFn;

  constructor(list: L, ...optionsTuple: OptionsTuple<ArrayElement<L>>) {
    this.opts = { ...defaultOpts, ...optionsTuple[0] };
    this.items = list;
    this.runesList = list.map((item) =>
      strToRunes(this.opts.selector(item).normalize())
    );
    this.algoFn = exactMatchNaive;
    switch (this.opts.fuzzy) {
      case "v2":
        this.algoFn = fuzzyMatchV2;
        break;
      case "v1":
        this.algoFn = fuzzyMatchV1;
        break;
    }
  }

  find(query: string): FzfResultItem<ArrayElement<L>>[] {
    query = query.normalize();

    let result: FzfResultItem<ArrayElement<L>>[] = [];

    result = this.opts.match.bind(this)(query);

    if (this.opts.sort) {
      for (const tiebreaker of this.opts.tiebreakers) {
        result.sort((a, b) => {
          if (a.score === b.score) {
            return tiebreaker(a, b, this.opts);
          }
          return 0;
        });
      }
    }

    if (Number.isFinite(this.opts.limit)) {
      result.splice(this.opts.limit);
    }

    return result;
  }
}
