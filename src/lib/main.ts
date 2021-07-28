import { fuzzyMatchV2, fuzzyMatchV1, AlgoFn, exactMatchNaive } from "./algo";
import { Rune, strToRunes } from "./runes";
import { slab } from "./slab";
import { normalizeRune } from "./normalize";
import { Casing, FzfResultItem, Tiebreaker } from "./types";
import { buildPatternForExtendedSearch } from "./pattern";
import { computeExtendedSearch } from "./extended";

export { tiebreakers } from "./tiebreakers";
export type { Tiebreaker, FzfResultItem } from "./types";

export interface Options<U> {
  /**
   * If `limit` is 32, top 32 items that matches your query will be returned.
   * By default all matched items are returned.
   *
   * @defaultValue Infinity
   */
  limit: number;
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
   * If asssigned `null`, an exact match will be made instead of a fuzzy one.
   *
   * @defaultValue "v2"
   */
  algo: "v1" | "v2" | null;
  /*
   * If true, you can add special patterns to narrow down your search.
   * To read about how they can be used, see [this section](https://github.com/junegunn/fzf/tree/7191ebb615f5d6ebbf51d598d8ec853a65e2274d#search-syntax).
   * For a quick glance, see [this piece](https://github.com/junegunn/fzf/blob/764316a53d0eb60b315f0bbcd513de58ed57a876/src/pattern.go#L12-L19).
   *
   * @defaultValue false
   */
  extended: boolean;
  /*
   * A list of functions that act as fallback and help to
   * sort result entries when the score between two entries is tied.
   *
   * Consider a tiebreaker to be a [JS array sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
   * compare function with an added third argument which is this `options` itself.
   *
   * @defaultValue []
   *
   * @example
   * ```js
   * function byLengthAsc(a, b, options) {
   *   return options.selector(a.item).length - options.selector(b.item).length;
   * }
   *
   * const fzf = new Fzf(list, { tiebreakers: [byLengthAsc] })
   * ```
   * This will result in following result entries having same score sorted like this:
   *    FROM                TO
   * axaa                axaa
   * bxbbbb              bxbbbb
   * cxcccccccccc        dxddddddd
   * dxddddddd           cxcccccccccc
   */
  tiebreakers: Tiebreaker<U>[];
  /*
   * If `true`, result items will be sorted in descending order by their score.
   * If `false`, result won't be sorted and tiebreakers won't affect the sort
   * order too.
   *
   * @defaultValue true
   */
  sort: boolean;
  /*
   * If `false`, matching will be done from backwards.
   *
   * @defaultValue true
   *
   * @example
   * /breeds/pyrenees when queried with "re"
   * with forward=true  : /b**re**eds/pyrenees
   * with forward=false : /breeds/py**re**nees
   *
   * Doing forward=false is useful, for example, if one needs to match a file
   * path and they prefer querying for the file name over directory names
   * present in the path.
   */
  forward: boolean;
}

const defaultOpts: Options<any> = {
  limit: Infinity,
  selector: (v) => v,
  casing: "smart-case",
  normalize: true,
  algo: "v2",
  extended: false,
  // example:
  // tiebreakers: [byLengthAsc, byStartAsc],
  tiebreakers: [],
  sort: true,
  forward: true,
};

type SortAttrs<U> =
  | {
      sort?: true;
      tiebreakers?: Options<U>["tiebreakers"];
    }
  | { sort: false };

type OptsToUse<U> = Omit<Partial<Options<U>>, "sort" | "tiebreakers"> &
  SortAttrs<U>;

// from https://stackoverflow.com/a/52318137/7683365
type OptionsTuple<U> = U extends string
  ? [options?: OptsToUse<U>]
  : [options: OptsToUse<U> & { selector: Options<U>["selector"] }];

export type FzfOptions<U = string> = U extends string
  ? OptsToUse<U>
  : OptsToUse<U> & { selector: Options<U>["selector"] };

export class Fzf<U> {
  private runesList: Rune[][];
  private items: U[];
  private readonly opts: Options<U>;
  private algoFn: AlgoFn;

  constructor(list: U[], ...optionsTuple: OptionsTuple<U>) {
    this.opts = { ...defaultOpts, ...optionsTuple[0] };
    this.items = list;
    this.runesList = list.map((item) => strToRunes(this.opts.selector(item)));
    this.algoFn = exactMatchNaive;
    switch (this.opts.algo) {
      case "v2":
        this.algoFn = fuzzyMatchV2;
        break;
      case "v1":
        this.algoFn = fuzzyMatchV1;
        break;
    }
  }

  find(query: string): FzfResultItem<U>[] {
    let result: FzfResultItem<U>[] = [];

    if (this.opts.extended) {
      result = this.extendedMatch(query);
    } else {
      result = this.basicMatch(query);
    }

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

  private extendedMatch(query: string) {
    const pattern = buildPatternForExtendedSearch(
      Boolean(this.opts.algo),
      this.opts.casing,
      this.opts.normalize,
      query
    );

    const scoreMap: Record<number, FzfResultItem<U>[]> = {};

    for (const [idx, runes] of this.runesList.entries()) {
      const match = computeExtendedSearch(
        runes,
        pattern,
        this.algoFn,
        this.opts.forward
      );
      if (match.offsets.length !== pattern.termSets.length) continue;

      let sidx = -1,
        eidx = -1;
      if (match.allPos.length > 0) {
        sidx = Math.min(...match.allPos);
        eidx = Math.max(...match.allPos) + 1;
      }

      const scoreKey = this.opts.sort ? match.totalScore : 0;
      if (scoreMap[scoreKey] === undefined) {
        scoreMap[scoreKey] = [];
      }
      scoreMap[scoreKey].push({
        score: match.totalScore,
        item: this.items[idx],
        positions: match.allPos,
        start: sidx,
        end: eidx,
      });
    }

    const scoresInDesc = Object.keys(scoreMap)
      .map((v) => parseInt(v, 10))
      .sort((a, b) => b - a);

    const result: FzfResultItem<U>[] = [];

    for (const score of scoresInDesc) {
      result.push(...scoreMap[score]);
      if (result.length >= this.opts.limit) {
        break;
      }
    }

    return result;
  }

  private basicMatch(query: string) {
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
        this.opts.forward,
        item,
        runes,
        true,
        slab
      );

      let positions: null | number[] = match[1];
      // for exact match, we don't get positions array back, so we'll fill it in by ourselves
      if (this.opts.algo === null) {
        positions = [];
        for (let i = match[0].start; i < match[0].end; ++i) {
          positions.push(i);
        }
      }

      return { item: this.items[index], ...match[0], positions };
    };

    const scoreMap: Record<number, FzfResultItem<U>[]> = {};

    this.runesList.forEach((v, i) => {
      const r = getResult(v, i);
      if (r.start === -1) return;

      const scoreKey = this.opts.sort ? r.score : 0;
      if (scoreMap[scoreKey] === undefined) {
        scoreMap[scoreKey] = [];
      }
      scoreMap[scoreKey].push(r);
    });

    const scoresInDesc = Object.keys(scoreMap)
      .map((v) => parseInt(v, 10))
      .sort((a, b) => b - a);

    const result: FzfResultItem<U>[] = [];

    for (const score of scoresInDesc) {
      result.push(...scoreMap[score]);
      if (result.length >= this.opts.limit) {
        break;
      }
    }

    return result;
  }
}
