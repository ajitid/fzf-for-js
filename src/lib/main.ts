import { fuzzyMatchV2 } from "./algo";
import { strToRunes } from "./runes";
/*
  `Result` type needs to be imported otherwise TS will complain while generating types.
  See https://github.com/microsoft/TypeScript/issues/5711
  and https://github.com/microsoft/TypeScript/issues/9944.
*/
import type { Result } from "./algo";

interface Options {
  cache: boolean;
  maxResultItems: number;
  sort: boolean;
}

const defaultOpts: Options = {
  cache: true,
  maxResultItems: Infinity,
  sort: true,
};

export interface FzfResultItem {
  str: string;
  result: Result;
  pos: number[] | null;
}

type query = string;

export class Fzf {
  private list;
  readonly opts: Options;
  private cache: Record<query, FzfResultItem[]> = {};

  constructor(list: string[], options: Partial<Options> = defaultOpts) {
    this.opts = { ...defaultOpts, ...options };
    this.list = list;
  }

  find = (query: string): FzfResultItem[] => {
    const pattern = query.toLowerCase();

    if (this.opts.cache) {
      const cachedResult = this.cache[pattern];
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }

    const patternRunes = strToRunes(pattern);
    let result = this.list
      .map((str) => {
        const match = fuzzyMatchV2(
          false,
          false,
          false,
          str,
          patternRunes,
          true,
          null
        );
        return { str, result: match[0], pos: match[1] };
      })
      .filter((v) => v.result.score !== 0);

    if (this.opts.sort) result.sort((a, b) => b.result.score - a.result.score);

    if (Number.isFinite(this.opts.maxResultItems)) {
      result = result.slice(0, this.opts.maxResultItems);
    }

    if (this.opts.cache) this.cache[pattern] = result;

    return result;
  };
}
