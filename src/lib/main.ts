import { fuzzyMatchV2, fuzzyMatchV1, AlgoFn } from "./algo";
import { Rune, strToRunes } from "./runes";
/*
  `Result` type needs to be imported otherwise TS will complain while generating types.
  See https://github.com/microsoft/TypeScript/issues/5711
  and https://github.com/microsoft/TypeScript/issues/9944.
*/
import type { Result } from "./algo";
import { slab } from "./slab";
import { normalizeRune } from "./normalize";
import { Casing } from "./types";
import { buildPatternForExtendedSearch } from "./pattern";

interface Options<U> {
  /**
   * Cache the results for the queries that you'll make.
   *
   * @defaultValue false
   */
  cache: boolean;
  /**
   * If `maxResultItems` is 32, top 32 items that matches your query will be returned.
   * By default all matched items are returned.
   *
   * @defaultValue Infinity
   */
  maxResultItems: number;
  /**
   * For each item in the list, target a specific property of the item to search for.
   */
  selector: (v: U) => string;
  /**
   * Defines what type of case sensitive search you want.
   *
   * @defaultValue "smart-case"
   */
  casing: Casing;
  /**
   * If true, FZF will try to remove diacritics from list items.
   * This is useful if the list contains items with diacritics but
   * you want to query with plain A-Z letters.
   *
   * @example
   * Zoë →  Zoe
   * blessèd →  blessed
   *
   * @defaultValue false
   */
  normalize: boolean;
  /*
   * Fuzzy algo to choose. Each algo has their own advantages, see here:
   * https://github.com/junegunn/fzf/blob/4c9cab3f8ae7b55f7124d7c3cf7ac6b4cc3db210/src/algo/algo.go#L5
   *
   * @defaultValue "v2"
   */
  algo: "v1" | "v2";
  extended: boolean;
  // TODO we need different sort metric
  // sort: boolean;
}

const defaultOpts: Options<any> = {
  cache: false,
  maxResultItems: Infinity,
  selector: (v) => v,
  casing: "smart-case",
  normalize: true,
  algo: "v2",
  extended: false,
};

export interface FzfResultEntry<U = string> extends Result {
  item: U;
  positions: number[] | null;
}

type query = string;

// from https://stackoverflow.com/a/52318137/7683365
type OptionsTuple<U> = U extends string
  ? [options?: Partial<Options<U>>]
  : [options: Partial<Options<U>> & { selector: Options<U>["selector"] }];

export class Fzf<U> {
  private runesList: Rune[][];
  private items: U[];
  private readonly opts: Options<U>;
  private cache: Record<query, FzfResultEntry<U>[]> = {};
  private algoFn: AlgoFn;

  constructor(list: U[], ...optionsTuple: OptionsTuple<U>) {
    this.opts = { ...defaultOpts, ...optionsTuple[0] };
    this.items = list;
    this.runesList = list.map((item) => strToRunes(this.opts.selector(item)));
    this.algoFn = this.opts.algo === "v2" ? fuzzyMatchV2 : fuzzyMatchV1;
  }

  find(query: string): FzfResultEntry<U>[] {
    // needs to be changed ------------
    let result: FzfResultEntry<U>[] = [];
    if (this.opts.normalize) {
      // result =
    } else {
      result = this.basicMatch(query);
    }
    // -------------------------------------

    const thresholdFilter = (v: FzfResultEntry<U>) => v.score !== 0;
    result = result.filter(thresholdFilter);

    const descScoreSorter = (a: FzfResultEntry<U>, b: FzfResultEntry<U>) =>
      b.score - a.score;
    result.sort(descScoreSorter);

    if (Number.isFinite(this.opts.maxResultItems)) {
      result = result.slice(0, this.opts.maxResultItems);
    }

    return result;
  }

  basicMatch(query: string) {
    let caseSensitive = false;
    switch (this.opts.casing) {
      case "smart-case":
        if (query.toLowerCase() !== query) {
          caseSensitive = true;
        }
        break;
      case "case-sensitive":
        caseSensitive = true;
        break;
      case "case-insensitive":
        query = query.toLowerCase();
        caseSensitive = false;
        break;
    }

    let runes = strToRunes(query);
    if (this.opts.normalize) {
      runes = runes.map(normalizeRune);
    }

    const getResult = (item: Rune[], index: number) => {
      const match = this.algoFn(
        caseSensitive,
        this.opts.normalize,
        true,
        item,
        runes,
        true,
        slab
      );
      return { item: this.items[index], ...match[0], positions: match[1] };
    };

    let result = this.runesList.map(getResult);
    return result;
  }
}
