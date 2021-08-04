import { fuzzyMatchV2, fuzzyMatchV1, AlgoFn, exactMatchNaive } from "./algo";
import { strToRunes } from "./runes";
import { slab } from "./slab";
import type { FzfResultItem, Options } from "./types";
import {
  buildPatternForExtendedMatch,
  buildRunesForBasicMatch,
} from "./pattern";
import { computeExtendedMatch } from "./extended";

export { tiebreakers } from "./tiebreakers";
export type { Tiebreaker, FzfResultItem } from "./types";

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
  private runesList: Int32Array[];
  private items: U[];
  private readonly opts: Options<U>;
  private algoFn: AlgoFn;

  constructor(list: U[], ...optionsTuple: OptionsTuple<U>) {
    this.opts = { ...defaultOpts, ...optionsTuple[0] };
    this.items = list;
    this.runesList = list.map((item) =>
      strToRunes(this.opts.selector(item).normalize())
    );
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
    query = query.normalize();

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
    const pattern = buildPatternForExtendedMatch(
      Boolean(this.opts.algo),
      this.opts.casing,
      this.opts.normalize,
      query
    );

    const scoreMap: Record<number, FzfResultItem<U>[]> = {};

    for (
      let idx = 0, runesListLength = this.runesList.length;
      idx < runesListLength;
      ++idx
    ) {
      const runes = this.runesList[idx];

      const match = computeExtendedMatch(
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

    return Fzf.getResultFromScoreMap(scoreMap, this.opts.limit);
  }

  private basicMatch(query: string) {
    const { queryRunes, caseSensitive } = buildRunesForBasicMatch(
      query,
      this.opts.casing,
      this.opts.normalize
    );

    const scoreMap: Record<number, FzfResultItem<U>[]> = {};

    for (let i = 0, len = this.runesList.length; i < len; ++i) {
      const itemRunes = this.runesList[i];
      if (queryRunes.length > itemRunes.length) continue;

      const res = this.algoFn(
        caseSensitive,
        this.opts.normalize,
        this.opts.forward,
        itemRunes,
        queryRunes,
        true,
        slab
      );
      let match = res[0],
        positions = res[1];

      if (match.start === -1) continue;

      // we don't get positions array back for exact match, so we'll fill it by ourselves
      if (this.opts.algo === null) {
        positions = [];
        for (let pos = match.start; pos < match.end; ++pos) {
          positions.push(pos);
        }
      }

      const scoreKey = this.opts.sort ? match.score : 0;
      if (scoreMap[scoreKey] === undefined) {
        scoreMap[scoreKey] = [];
      }
      scoreMap[scoreKey].push({
        item: this.items[i],
        ...match,
        positions,
      });
    }

    return Fzf.getResultFromScoreMap(scoreMap, this.opts.limit);
  }

  private static getResultFromScoreMap<T>(
    scoreMap: Record<number, FzfResultItem<T>[]>,
    limit: number
  ): FzfResultItem<T>[] {
    const scoresInDesc = Object.keys(scoreMap)
      .map((v) => parseInt(v, 10))
      .sort((a, b) => b - a);

    const result: FzfResultItem<T>[] = [];

    for (const score of scoresInDesc) {
      result.push(...scoreMap[score]);
      if (result.length >= limit) {
        break;
      }
    }

    return result;
  }
}
