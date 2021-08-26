import { fuzzyMatchV2, fuzzyMatchV1, AlgoFn, exactMatchNaive } from "./algo";
import { basicMatch, asyncBasicMatch } from "./matchers";
import { Rune, strToRunes } from "./runes";
import {
  FzfResultItem,
  BaseOptions,
  SyncOptions,
  AsyncOptions,
  Tiebreaker,
  Token,
  Selector,
} from "./types";

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type SortAttrs<U> =
  | {
      sort?: true;
      tiebreakers?: Tiebreaker<U>[];
    }
  | { sort: false };

type BaseOptsToUse<U> = Omit<Partial<BaseOptions<U>>, "sort" | "tiebreakers"> &
  SortAttrs<U>;

// from https://stackoverflow.com/a/52318137/7683365
type BaseOptionsTuple<U> = U extends string
  ? [options?: BaseOptsToUse<U>]
  : [options: BaseOptsToUse<U> & { selector: Selector<U> }];

const defaultOpts: BaseOptions<any> = {
  limit: Infinity,
  selector: (v) => v,
  casing: "smart-case",
  normalize: true,
  fuzzy: "v2",
  // example:
  // tiebreakers: [byLengthAsc, byStartAsc],
  tiebreakers: [],
  sort: true,
  forward: true,
};

abstract class BaseFinder<L extends ReadonlyArray<any>> {
  runesList: Rune[][];
  items: L;
  readonly opts: BaseOptions<ArrayElement<L>>;
  algoFn: AlgoFn;

  constructor(list: L, ...optionsTuple: BaseOptionsTuple<ArrayElement<L>>) {
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
}

export type SyncOptsToUse<U> = BaseOptsToUse<U> &
  Partial<Pick<SyncOptions<U>, "match">>;

export type SyncOptionsTuple<U> = U extends string
  ? [options?: SyncOptsToUse<U>]
  : [options: SyncOptsToUse<U> & { selector: Selector<U> }];

const syncDefaultOpts: SyncOptions<any> = {
  ...defaultOpts,
  match: basicMatch,
};

export class SyncFinder<L extends ReadonlyArray<any>> extends BaseFinder<L> {
  readonly opts: SyncOptions<ArrayElement<L>>;

  constructor(list: L, ...optionsTuple: SyncOptionsTuple<ArrayElement<L>>) {
    super(list, ...optionsTuple);
    this.opts = { ...syncDefaultOpts, ...optionsTuple[0] };
  }

  find(query: string): FzfResultItem<ArrayElement<L>>[] {
    if (query.length === 0 || this.items.length === 0)
      return this.items
        .slice(0, this.opts.limit)
        .map(createResultItemWithEmptyPos);

    query = query.normalize();

    let result: FzfResultItem<ArrayElement<L>>[] =
      this.opts.match.bind(this)(query);

    return postProcessResultItems(result, this.opts);
  }
}

export type AsyncOptsToUse<U> = BaseOptsToUse<U> &
  Partial<Pick<AsyncOptions<U>, "match">>;

export type AsyncOptionsTuple<U> = U extends string
  ? [options?: AsyncOptsToUse<U>]
  : [options: AsyncOptsToUse<U> & { selector: Selector<U> }];

const asyncDefaultOpts: AsyncOptions<any> = {
  ...defaultOpts,
  match: asyncBasicMatch,
};

export class AsyncFinder<L extends ReadonlyArray<any>> extends BaseFinder<L> {
  readonly opts: AsyncOptions<ArrayElement<L>>;
  token: Token;

  constructor(list: L, ...optionsTuple: AsyncOptionsTuple<ArrayElement<L>>) {
    super(list, ...optionsTuple);
    this.opts = { ...asyncDefaultOpts, ...optionsTuple[0] };
    this.token = { cancelled: false };
  }

  async find(query: string): Promise<FzfResultItem<ArrayElement<L>>[]> {
    this.token.cancelled = true;
    this.token = { cancelled: false };

    if (query.length === 0 || this.items.length === 0)
      return this.items
        .slice(0, this.opts.limit)
        .map(createResultItemWithEmptyPos);

    query = query.normalize();

    let result = (await this.opts.match.bind(this)(
      query,
      this.token
    )) as FzfResultItem<ArrayElement<L>>[];

    return postProcessResultItems(result, this.opts);
  }
}

const createResultItemWithEmptyPos = <U>(item: U): FzfResultItem<U> => ({
  item,
  start: -1,
  end: -1,
  score: 0,
  positions: new Set(),
});

function postProcessResultItems<U>(
  result: FzfResultItem<U>[],
  opts: BaseOptions<U>
) {
  if (opts.sort) {
    const { selector } = opts;

    result.sort((a, b) => {
      if (a.score === b.score) {
        for (const tiebreaker of opts.tiebreakers) {
          const diff = tiebreaker(a, b, selector);
          if (diff !== 0) {
            return diff;
          }
        }
      }
      return 0;
    });
  }

  if (Number.isFinite(opts.limit)) {
    result.splice(opts.limit);
  }

  return result;
}
