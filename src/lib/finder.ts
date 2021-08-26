import { fuzzyMatchV2, fuzzyMatchV1, AlgoFn, exactMatchNaive } from "./algo";
import { asyncBasicMatch, asyncExtendedMatch, basicMatch } from "./matchers";
import { Rune, strToRunes } from "./runes";
import { AsyncOptions, FzfResultItem, Options, Token } from "./types";

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

export class Finder<L extends ReadonlyArray<any>> {
  runesList: Rune[][];
  items: L;
  readonly opts: Options<ArrayElement<L>>;
  algoFn: AlgoFn;
  token: Token;

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
    this.token = { cancelled: false };
  }

  find(query: string): FzfResultItem<ArrayElement<L>>[] {
    if (query.length === 0 || this.items.length === 0)
      return this.items.slice(0, this.opts.limit).map((item) => ({
        item,
        start: -1,
        end: -1,
        score: 0,
        positions: new Set(),
      }));

    query = query.normalize();

    let result: FzfResultItem<ArrayElement<L>>[] =
      this.opts.match.bind(this)(query);

    if (this.opts.sort) {
      const { selector } = this.opts;

      result.sort((a, b) => {
        if (a.score === b.score) {
          for (const tiebreaker of this.opts.tiebreakers) {
            const diff = tiebreaker(a, b, selector);
            if (diff !== 0) {
              return diff;
            }
          }
        }
        return 0;
      });
    }

    if (Number.isFinite(this.opts.limit)) {
      result.splice(this.opts.limit);
    }

    return result;
  }
}

export type AsyncOptsToUse<U> = Omit<
  Partial<AsyncOptions<U>>,
  "sort" | "tiebreakers"
> &
  SortAttrs<U>;

// from https://stackoverflow.com/a/52318137/7683365
export type AsyncOptionsTuple<U> = U extends string
  ? [options?: AsyncOptsToUse<U>]
  : [options: AsyncOptsToUse<U> & { selector: AsyncOptions<U>["selector"] }];
const asyncDefaultOpts: AsyncOptions<any> = {
  ...defaultOpts,
  match: asyncBasicMatch,
};

export class AsyncFinder<L extends ReadonlyArray<any>> {
  runesList: Rune[][];
  items: L;
  readonly opts: AsyncOptions<ArrayElement<L>>;
  algoFn: AlgoFn;
  token: Token;

  constructor(list: L, ...optionsTuple: AsyncOptionsTuple<ArrayElement<L>>) {
    this.opts = { ...asyncDefaultOpts, ...optionsTuple[0] };
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
    this.token = { cancelled: false };
  }

  async find(query: string): Promise<FzfResultItem<ArrayElement<L>>[]> {
    this.token.cancelled = true;
    this.token = { cancelled: false };

    if (query.length === 0 || this.items.length === 0)
      return this.items.slice(0, this.opts.limit).map((item) => ({
        item,
        start: -1,
        end: -1,
        score: 0,
        positions: new Set(),
      }));

    query = query.normalize();

    let result = (await this.opts.match.bind(this)(
      query,
      this.token
    )) as FzfResultItem<ArrayElement<L>>[];

    if (this.opts.sort) {
      const { selector } = this.opts;

      result.sort((a, b) => {
        if (a.score === b.score) {
          for (const tiebreaker of this.opts.tiebreakers) {
            const diff = tiebreaker(a, b, selector);
            if (diff !== 0) {
              return diff;
            }
          }
        }
        return 0;
      });
    }

    if (Number.isFinite(this.opts.limit)) {
      result.splice(this.opts.limit);
    }

    return result;
  }
}
