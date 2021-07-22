import { fuzzyMatchV2, fuzzyMatchV1, AlgoFn } from "./algo";
import { Rune, strToRunes } from "./runes";
/*
  `Result` type needs to be imported otherwise TS will complain while generating types.
  See https://github.com/microsoft/TypeScript/issues/5711
  and https://github.com/microsoft/TypeScript/issues/9944.
*/
import type { Result } from "./algo";
import { Slab, slab } from "./slab";
import { normalizeRune } from "./normalize";
import { Casing } from "./types";
import { buildPatternForExtendedSearch, termTypeMap } from "./pattern";
import { Int32 } from "./numerics";

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

interface Token {
  text: Rune[];
  prefixLength: Int32;
}

// this is [int32, int32] in golang code
type Offset = [number, number];

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
    let result: FzfResultEntry<U>[] = [];

    if (this.opts.extended) {
      result = this.extendedMatch(query);
    } else {
      result = this.basicMatch(query);
    }

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

  extendedMatch(query: string) {
    const pattern = buildPatternForExtendedSearch(
      true,
      this.opts.casing,
      this.opts.normalize,
      query
    );
    let result: FzfResultEntry<U>[] = [];
    for (const [idx, runes] of this.runesList.entries()) {
      const stuff = v2stuff(runes, pattern, this.opts.algo);
      let sidx = -1,
        eidx = -1;
      if (stuff.offsets.length > 0) {
        sidx = stuff.offsets[0][0];
        eidx = stuff.offsets[0][1];
      }
      result.push({
        score: stuff.totalScore,
        item: this.items[idx],
        positions: stuff.allPos,
        start: sidx,
        end: eidx,
      });
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

function iter(
  pfun: AlgoFn,
  tokens: Token[],
  caseSensitive: boolean,
  normalize: boolean,
  pattern: Rune[],
  slab: Slab
): [Offset, number, number[] | null] {
  for (const part of tokens) {
    const [res, pos] = pfun(
      caseSensitive,
      normalize,
      true,
      part.text,
      pattern,
      true,
      slab
    );
    if (res.start >= 0) {
      // res.start and res.end were typecasted to int32 here
      const sidx = res.start + part.prefixLength;
      const eidx = res.end + part.prefixLength;
      if (pos !== null) {
        for (let i = 0; i < pos.length; ++i) {
          // part.prefixLength is typecasted to int here
          pos[i] += part.prefixLength;
        }
      }
      return [[sidx, eidx], res.score, pos];
    }
  }
  return [[-1, -1], 0, null];
}

function v2stuff(
  text: Rune[],
  pattern: ReturnType<typeof buildPatternForExtendedSearch>,
  fuzzyAlgo: "v1" | "v2"
) {
  // https://github.com/junegunn/fzf/blob/764316a53d0eb60b315f0bbcd513de58ed57a876/src/pattern.go#L354
  // ^ TODO maybe this helps in caching by not calculating already calculated stuff but whatever
  const input: {
    text: Rune[];
    prefixLength: number;
  }[] = [
    {
      text: text,
      prefixLength: 0,
    },
  ];

  const offsets: Offset[] = [];
  let totalScore = 0;
  const allPos = [];

  for (const termSet of pattern.termSets) {
    let offset: Offset = [0, 0];
    let currentScore = 0;
    let matched = false;

    for (const term of termSet) {
      let algoFn = termTypeMap[term.typ];
      if (fuzzyAlgo === "v1") {
        algoFn = fuzzyMatchV1;
      }
      const [off, score, pos] = iter(
        algoFn,
        input,
        term.caseSensitive,
        // TODO doesn't normalize still come from this.opts??
        term.normalize,
        term.text,
        slab
      );

      const sidx = off[0];
      if (sidx >= 0) {
        if (term.inv) {
          continue;
        }

        offset = off;
        currentScore = score;
        matched = true;

        if (pos !== null) {
          allPos.push(...pos);
        } else {
          for (let idx = off[0]; idx < off[1]; ++idx) {
            // idx is typecasted to int
            allPos.push(idx);
          }
        }
        break;
      } else if (term.inv) {
        offset = [0, 0];
        currentScore = 0;
        matched = true;
        continue;
      }
    }
    if (matched) {
      offsets.push(offset);
      totalScore += currentScore;
    }
  }

  return { offsets, totalScore, allPos };
}
