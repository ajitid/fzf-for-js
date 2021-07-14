import { fuzzyMatchV2 } from "./algo";
import { Rune, strToRunes } from "./runes";
/*
  `Result` type needs to be imported otherwise TS will complain while generating types.
  See https://github.com/microsoft/TypeScript/issues/5711
  and https://github.com/microsoft/TypeScript/issues/9944.
*/
import type { Result } from "./algo";
import { makeSlab, SLAB_16_SIZE, SLAB_32_SIZE } from "./slab";

interface Options<U> {
  cache: boolean;
  maxResultItems: number;
  selector: (v: U) => string;
  // TODO we need different sort metric
  // sort: boolean;
}

const defaultOpts: Options<any> = {
  cache: false,
  maxResultItems: Infinity,
  selector: (v) => v,
};

export interface FzfResultItem<U = string> {
  item: U;
  result: Result;
  positions: number[] | null;
}

type query = string;

// TODO maybe: do not initialise slab unless an fzf algo that needs slab gets called
const slab = makeSlab(SLAB_16_SIZE, SLAB_32_SIZE);

// from https://stackoverflow.com/a/52318137/7683365
type OptionsTuple<U> = U extends string
  ? [options?: Partial<Options<U>>]
  : [options: Partial<Options<U>> & { selector: Options<U>["selector"] }];

export class Fzf<U> {
  private runesList: Rune[][];
  private items: U[];
  private readonly opts: Options<U>;
  private cache: Record<query, FzfResultItem<U>[]> = {};

  constructor(list: U[], ...optionsTuple: OptionsTuple<U>) {
    this.opts = { ...defaultOpts, ...optionsTuple[0] };
    this.items = list;
    this.runesList = list.map((item) => strToRunes(this.opts.selector(item)));
  }

  find = (query: string): FzfResultItem<U>[] => {
    if (this.opts.cache) {
      const cachedResult = this.cache[query];
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }

    let caseSensitive = false;
    // smartcase
    if (query.toLowerCase() !== query) {
      caseSensitive = true;
    }

    const runes = strToRunes(query);
    const getResult = (item: Rune[], index: number) => {
      const match = fuzzyMatchV2(
        caseSensitive,
        false,
        false,
        item,
        runes,
        true,
        slab
      );
      return { item: this.items[index], result: match[0], positions: match[1] };
    };
    const thresholdFilter = (v: FzfResultItem<U>) => v.result.score !== 0;
    let result = this.runesList.map(getResult).filter(thresholdFilter);

    const descScoreSorter = (a: FzfResultItem<U>, b: FzfResultItem<U>) =>
      b.result.score - a.result.score;
    result.sort(descScoreSorter);

    if (Number.isFinite(this.opts.maxResultItems)) {
      result = result.slice(0, this.opts.maxResultItems);
    }

    if (this.opts.cache) this.cache[query] = result;

    return result;
  };
}

export const fzfQuick = (query: string) => {
  let caseSensitive = false;
  // smartcase
  if (query.toLowerCase() !== query) {
    caseSensitive = true;
  }

  const runes = strToRunes(query);

  return (text: string): FzfResultItem => {
    // TODO this conversion needs to be somewhere else
    const textRunes = strToRunes(text);

    const match = fuzzyMatchV2(
      caseSensitive,
      false,
      false,
      textRunes,
      runes,
      true,
      slab
    );
    return { item: text, result: match[0], positions: match[1] };
  };
};
