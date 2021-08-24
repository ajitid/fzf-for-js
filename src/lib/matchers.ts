import { slab } from "./slab";
import {
  buildPatternForExtendedMatch,
  buildPatternForBasicMatch,
} from "./pattern";
import { computeExtendedMatch } from "./extended";
import { Finder } from "./finder";
import type { FzfResultItem, Token } from "./types";

function getResultFromScoreMap<T>(
  scoreMap: Record<number, FzfResultItem<T>[]>,
  limit: number
): FzfResultItem<T>[] {
  const scoresInDesc = Object.keys(scoreMap)
    .map((v) => parseInt(v, 10))
    .sort((a, b) => b - a);

  let result: FzfResultItem<T>[] = [];

  for (const score of scoresInDesc) {
    result = result.concat(scoreMap[score]);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

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

    // If we aren't sorting, we'll put all items in the same score bucket (zero score).
    // This will result in us getting items in same order in which we send it in the list.
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
  query: string
) {
  const pattern = buildPatternForExtendedMatch(
    Boolean(this.opts.fuzzy),
    this.opts.casing,
    this.opts.normalize,
    query
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

// async matchers

const isNode =
  // @ts-expect-error TS is configured for browsers
  typeof require !== "undefined" && typeof window === "undefined";

export function asyncMatcher<F>(
  token: Token,
  len: number,
  iter: (index: number) => unknown,
  onFinish: () => F
): Promise<F> {
  return new Promise((resolve, reject) => {
    const MAX_BUMP = 1000;
    let i = 0,
      max = Math.min(MAX_BUMP, len);

    const step = () => {
      if (token.cancelled) return reject("search cancelled");

      for (; i < max; ++i) {
        iter(i);
      }

      if (max < len) {
        max = Math.min(max + MAX_BUMP, len);
        isNode
          ? // @ts-expect-error unavailable or deprecated for browsers
            setImmediate(step)
          : setTimeout(step);
      } else {
        resolve(onFinish());
      }
    };

    step();
  });
}

export async function asyncBasicMatch<U>(
  this: Finder<ReadonlyArray<U>>,
  query: string,
  token: Token
): Promise<FzfResultItem<U>[]> {
  const { queryRunes, caseSensitive } = buildPatternForBasicMatch(
    query,
    this.opts.casing,
    this.opts.normalize
  );

  const scoreMap: Record<number, FzfResultItem<U>[]> = {};

  return asyncMatcher(
    token,
    this.runesList.length,
    (i) => {
      const itemRunes = this.runesList[i];
      if (queryRunes.length > itemRunes.length) return;

      let [match, positions] = this.algoFn(
        caseSensitive,
        this.opts.normalize,
        this.opts.forward,
        itemRunes,
        queryRunes,
        true,
        slab
      );
      if (match.start === -1) return;

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
    },
    () => getResultFromScoreMap(scoreMap, this.opts.limit)
  );
}

export function asyncExtendedMatch<U>(
  this: Finder<ReadonlyArray<U>>,
  query: string,
  token: Token
) {
  return new Promise((resolve, reject) => {
    const pattern = buildPatternForExtendedMatch(
      Boolean(this.opts.fuzzy),
      this.opts.casing,
      this.opts.normalize,
      query
    );

    const scoreMap: Record<number, FzfResultItem<U>[]> = {};

    const MAX_BUMP = 1000;
    let i = 0,
      len = this.runesList.length,
      max = Math.min(MAX_BUMP, len);

    const step = () => {
      if (token.cancelled) return reject("search cancelled");

      for (; i < max; ++i) {
        const runes = this.runesList[i];
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
          item: this.items[i],
          positions: match.allPos,
          start: sidx,
          end: eidx,
        });
      }

      if (max < len) {
        max = Math.min(max + MAX_BUMP, len);
        isNode
          ? // @ts-expect-error unavailable or deprecated for browsers
            setImmediate(step)
          : setTimeout(step);
      } else {
        resolve(getResultFromScoreMap(scoreMap, this.opts.limit));
      }
    };

    step();
  });
}
