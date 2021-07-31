import { AlgoFn } from "./algo";
import { Int32 } from "./numerics";
import { buildPatternForExtendedMatch, TermType, termTypeMap } from "./pattern";
import { Rune } from "./runes";
import { slab, Slab } from "./slab";

interface Token {
  text: Rune[];
  prefixLength: Int32;
}

// this is [int32, int32] in golang code
type Offset = [number, number];

function iter(
  algoFn: AlgoFn,
  tokens: Token[],
  caseSensitive: boolean,
  normalize: boolean,
  forward: boolean,
  pattern: Rune[],
  slab: Slab
): [Offset, number, number[] | null] {
  for (const part of tokens) {
    const [res, pos] = algoFn(
      caseSensitive,
      normalize,
      forward,
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

export function computeExtendedMatch(
  text: Rune[],
  pattern: ReturnType<typeof buildPatternForExtendedMatch>,
  fuzzyAlgo: AlgoFn,
  forward: boolean
) {
  // https://github.com/junegunn/fzf/blob/764316a53d0eb60b315f0bbcd513de58ed57a876/src/pattern.go#L354
  // ^ TODO maybe this helps in caching by not calculating already calculated stuff but whatever
  const input: {
    text: Rune[];
    prefixLength: number;
  }[] = [
    {
      text,
      prefixLength: 0,
    },
  ];

  const offsets: Offset[] = [];
  let totalScore = 0;
  const allPos: number[] = [];

  for (const termSet of pattern.termSets) {
    let offset: Offset = [0, 0];
    let currentScore = 0;
    let matched = false;

    for (const term of termSet) {
      let algoFn = termTypeMap[term.typ];
      if (term.typ === TermType.Fuzzy) {
        algoFn = fuzzyAlgo;
      }
      const [off, score, pos] = iter(
        algoFn,
        input,
        term.caseSensitive,
        term.normalize,
        forward,
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
