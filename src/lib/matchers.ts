import { slab } from "./slab";
import {
  buildPatternForExtendedMatch,
  buildPatternForBasicMatch,
  ExtendedFeatures,
} from "./pattern";
import { computeExtendedMatch } from "./extended";
import { Finder } from "./finder";
import type { FzfResultItem } from "./types";

export function basicMatch<U>(this: Finder<ReadonlyArray<U>>, query: string) {
  const { queryRunes, caseSensitive } = buildPatternForBasicMatch(
    query,
    this.opts.casing,
    this.opts.normalize
  );

  const scoreMap: Record<number, FzfResultItem<U>[]> = {};

  for (let i = 0, len = this.runesList.length; i < len; ++i) {
    const itemRunes = this.runesList[i];
    if (queryRunes.length > itemRunes.length) continue;

    let [match, positions] = this.algoFn(
      caseSensitive,
      this.opts.normalize,
      this.opts.forward,
      itemRunes,
      queryRunes,
      true,
      slab
    );
    if (match.start === -1) continue;

    // we don't get positions array back for exact match, so we'll fill it by ourselves
    if (this.opts.fuzzy === false) {
      positions = new Set();
      for (let position = match.start; position < match.end; ++position) {
        positions.add(position);
      }
    }

    const scoreKey = this.opts.sort ? match.score : 0;
    if (scoreMap[scoreKey] === undefined) {
      scoreMap[scoreKey] = [];
    }
    scoreMap[scoreKey].push({
      item: this.items[i],
      ...match,
      positions: positions ?? new Set(),
    });
  }

  return getResultFromScoreMap(scoreMap, this.opts.limit);
}

export function extendedMatch<U>(
  this: Finder<ReadonlyArray<U>>,
  query: string,
  features?: Partial<ExtendedFeatures>
) {
  const pattern = buildPatternForExtendedMatch(
    Boolean(this.opts.fuzzy),
    this.opts.casing,
    this.opts.normalize,
    query,
    features
  );

  const scoreMap: Record<number, FzfResultItem<U>[]> = {};

  for (const [idx, runes] of this.runesList.entries()) {
    const match = computeExtendedMatch(
      runes,
      pattern,
      this.algoFn,
      this.opts.forward
    );
    if (match.offsets.length !== pattern.termSets.length) continue;

    let sidx = -1,
      eidx = -1;
    if (match.allPos.size > 0) {
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

  return getResultFromScoreMap(scoreMap, this.opts.limit);
}

export function enhancedMatch<U>(
  this: Finder<ReadonlyArray<U>>,
  query: string
) {
  const features: ExtendedFeatures = {
    end: false,
    exact: false,
    not: false,
    or: false,
    start: false,
  };

  return extendedMatch.bind(this)(query, features) as FzfResultItem<U>[];
}

function getResultFromScoreMap<T>(
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
