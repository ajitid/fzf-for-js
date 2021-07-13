// porting FZF at commit hash 7191ebb615f5d6ebbf51d598d8ec853a65e2274d of junegunn/fzf
// and using https://github.com/nvim-telescope/telescope-fzf-native.nvim/blob/f0379f50aa79a2bf028340067e443a3079b29d54/src/fzf.c
// for extra reference

import { normalized } from "./normalize";
import { Slab } from "./slab";
import { Int16, Int32, toShort, toInt, maxInt16 } from "./numerics";
import { Rune, runesToStr } from "./runes";
import { whitespacesAtEnd, whitespacesAtStart } from "./char";

const DEBUG = false;

const MAX_ASCII = "\u007F".codePointAt(0)!;
const CAPITAL_A_RUNE = "A".codePointAt(0)!;
const CAPITAL_Z_RUNE = "Z".codePointAt(0)!;
const SMALL_A_RUNE = "a".codePointAt(0)!;
const SMALL_Z_RUNE = "z".codePointAt(0)!;
const NUMERAL_ZERO_RUNE = "0".codePointAt(0)!;
const NUMERAL_NINE_RUNE = "9".codePointAt(0)!;

function indexAt(index: number, max: number, forward: boolean) {
  if (forward) {
    return index;
  }

  return max - index - 1;
}

export interface Result {
  // TODO from junegunn/fzf - int32 should suffice
  start: number;
  end: number;
  score: number;
}

export const SCORE_MATCH = 16,
  SCORE_GAP_START = -3,
  // FIXME: sure it shouldn't be renamed as "extension"??
  SCORE_GAP_EXTENTION = -1,
  BONUS_BOUNDARY = SCORE_MATCH / 2,
  BONUS_NON_WORD = SCORE_MATCH / 2,
  BONUS_CAMEL_123 = BONUS_BOUNDARY + SCORE_GAP_EXTENTION,
  BONUS_CONSECUTIVE = -(SCORE_GAP_START + SCORE_GAP_EXTENTION),
  BONUS_FIRST_CHAR_MULTIPLIER = 2;

enum Char {
  NonWord,
  Lower,
  Upper,
  Letter,
  Number,
}

function posArray(withPos: boolean, len: number) {
  if (withPos) {
    // TLDR; there is no easy way to do
    // ```
    // pos := make([]int, 0, len)
    // return &pos
    // ```
    // in JS.
    //
    // Golang has len and capacity:
    // see https://tour.golang.org/moretypes/13
    // and https://stackoverflow.com/a/41668362/7683365
    //
    // JS has a way to define capacity (`new Array(capacity)`) but
    // then all elements in the capacity will be `undefined` and a push
    // will result in the push at the end of the capacity rather than
    // from the start of it (which happens in go using `append`).
    // So while we'll accept len as arg, we won't do anything with it.
    //
    // {{ this is useless here, ignore: const pos = new Array(len).fill(0) }}

    const pos = new Array();
    return pos;
  }

  return null;
}

function alloc16(
  offset: number,
  slab: Slab | null,
  size: number
): [number, Int16Array] {
  if (slab !== null && slab.i16.length > offset + size) {
    const subarray = slab.i16.subarray(offset, offset + size);
    return [offset + size, subarray];
  }

  return [offset, new Int16Array(size)];
}

function alloc32(
  offset: number,
  slab: Slab | null,
  size: number
): [number, Int32Array] {
  if (slab !== null && slab.i32.length > offset + size) {
    const subarray = slab.i32.subarray(offset, offset + size);
    return [offset + size, subarray];
  }

  return [offset, new Int32Array(size)];
}

// rune is type int32 in Golang https://blog.golang.org/strings#TOC_5.
// and represents a character. In JavaScript, rune will be
// int32 [Go] == 'a'.codePointAt(0) [JS] == 97 [number]
//
// I'm considering `input` arg as a string not an array of chars,
// this might led to creation of too many strings in string pool resulting in
// huge garbage collection. JS can't parse it in terms of bytes so I might need to use
// char array instead (which will technically be string array)
function charClassOfAscii(rune: Rune): Char {
  if (rune >= SMALL_A_RUNE && rune <= SMALL_Z_RUNE) {
    return Char.Lower;
  } else if (rune >= CAPITAL_A_RUNE && rune <= CAPITAL_Z_RUNE) {
    return Char.Upper;
  } else if (rune >= NUMERAL_ZERO_RUNE && rune <= NUMERAL_NINE_RUNE) {
    return Char.Number;
  } else {
    return Char.NonWord;
  }
}

function charClassOfNonAscii(rune: Rune): Char {
  const char = String.fromCodePoint(rune);

  // checking whether it is a lowercase letter by checking whether converting
  // it into uppercase has any effect on it
  if (char !== char.toUpperCase()) {
    return Char.Lower;
  } else if (char !== char.toLowerCase()) {
    return Char.Upper;
  } else if (char.match(/\p{Number}/gu) !== null) {
    // from https://stackoverflow.com/a/60827177/7683365 and
    // https://stackoverflow.com/questions/14891129/regular-expression-pl-and-pn
    return Char.Number;
  } else if (char.match(/\p{Letter}/gu) !== null) {
    return Char.Letter;
  }

  return Char.NonWord;
}

function charClassOf(rune: Rune): Char {
  if (rune <= MAX_ASCII) {
    return charClassOfAscii(rune);
  }

  return charClassOfNonAscii(rune);
}

function bonusFor(prevClass: Char, currClass: Char): Int16 {
  if (prevClass === Char.NonWord && currClass !== Char.NonWord) {
    // word boundary
    return BONUS_BOUNDARY;
  } else if (
    (prevClass === Char.Lower && currClass === Char.Upper) ||
    (prevClass !== Char.Number && currClass === Char.Number)
  ) {
    // camelCase letter123
    return BONUS_CAMEL_123;
  } else if (currClass === Char.NonWord) {
    return BONUS_NON_WORD;
  }

  return 0;
}

function bonusAt(input: Rune[], idx: number): Int16 {
  if (idx === 0) {
    return BONUS_BOUNDARY;
  }

  return bonusFor(charClassOf(input[idx - 1]), charClassOf(input[idx]));
}

function normalizeRune(rune: Rune): Rune {
  if (rune < 0x00c0 || rune > 0x2184) {
    return rune;
  }

  // while a char can be converted to hex using str.charCodeAt().toString(16), it is not needed
  // because in `normalized` map those hex in keys will be converted to decimals.
  // Also we are passing a number instead of a converting a char so the above line doesn't apply (and that
  // we are using codePointAt instead of charCodeAt)
  const normalizedChar = normalized[rune];
  if (normalizedChar !== undefined) return normalizedChar.codePointAt(0)!;

  return rune;
}

export type AlgoFn = (
  caseSensitive: boolean,
  normalize: boolean,
  forward: boolean,
  input: Rune[],
  pattern: Rune[],
  withPos: boolean,
  slab: Slab | null
) => [Result, number[] | null];

function trySkip(
  input: Rune[],
  caseSensitive: boolean,
  char: Rune,
  from: number
): number {
  let rest = input.slice(from);
  let idx = rest.indexOf(char);
  if (idx === 0) {
    return from;
  }

  if (!caseSensitive && char >= SMALL_A_RUNE && char <= SMALL_Z_RUNE) {
    if (idx > 0) {
      rest = rest.slice(0, idx);
    }

    // TODO I hope that I'm doing it right
    // convert ascii lower to upper by subtracting 32 (a -> A)
    // and then checking if it is present in str
    // dunno, this logic looks odd for chars which aren't alphabets
    const uidx = rest.indexOf(char - 32);
    if (uidx >= 0) {
      idx = uidx;
    }
  }

  if (idx < 0) {
    return -1;
  }

  return from + idx;
}

function isAscii(runes: Rune[]) {
  for (const rune of runes) {
    if (rune >= 128) {
      return false;
    }
  }

  return true;
}

function asciiFuzzyIndex(
  input: Rune[],
  pattern: Rune[],
  caseSensitive: boolean
): number {
  /*
   * this https://github.com/junegunn/fzf/blob/7191ebb615f5d6ebbf51d598d8ec853a65e2274d/src/algo/algo.go#L280-L283
   * is basically checking if input has only ASCII chars, see
   * https://github.com/junegunn/fzf/blob/7191ebb615f5d6ebbf51d598d8ec853a65e2274d/src/util/chars.go#L38-L43
   * and https://github.com/junegunn/fzf/blob/7191ebb615f5d6ebbf51d598d8ec853a65e2274d/src/util/chars.go#L48
   */
  if (!isAscii(input)) {
    return 0;
  }

  if (!isAscii(pattern)) {
    return -1;
  }

  let firstIdx = 0,
    idx = 0;

  for (let pidx = 0; pidx < pattern.length; pidx++) {
    idx = trySkip(input, caseSensitive, pattern[pidx], idx);
    if (idx < 0) {
      return -1;
    }
    if (pidx === 0 && idx > 0) {
      firstIdx = idx - 1;
    }
    idx++;
  }

  return firstIdx;
}

function debugV2(
  T: Rune[],
  pattern: Rune[],
  F: Int32[],
  lastIdx: number,
  H: Int16[],
  C: Int16[]
) {
  // TODO
  console.error(" complete this!!!! ");
}

export const fuzzyMatchV2: AlgoFn = (
  caseSensitive,
  normalize,
  forward,
  input,
  pattern,
  withPos,
  slab
) => {
  const M = pattern.length;
  if (M === 0) {
    return [{ start: 0, end: 0, score: 0 }, posArray(withPos, M)];
  }

  const N = input.length;

  if (slab !== null && N * M > slab.i16.length) {
    return fuzzyMatchV1(
      caseSensitive,
      normalize,
      forward,
      input,
      pattern,
      withPos,
      slab
    );
  }

  // Phase 1. Optimized search for ASCII string
  const idx = asciiFuzzyIndex(input, pattern, caseSensitive);
  if (idx < 0) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  let offset16 = 0,
    offset32 = 0,
    H0: Int16Array | null = null,
    C0: Int16Array | null = null,
    B: Int16Array | null = null,
    F: Int32Array | null = null;
  [offset16, H0] = alloc16(offset16, slab, N);
  [offset16, C0] = alloc16(offset16, slab, N);
  [offset16, B] = alloc16(offset16, slab, N);
  [offset32, F] = alloc32(offset32, slab, M);
  const [, T] = alloc32(offset32, slab, N);

  for (let i = 0; i < T.length; i++) {
    T[i] = input[i];
  }

  // Phase 2. Calculate bonus for each point
  let maxScore = toShort(0),
    maxScorePos = 0;
  let pidx = 0,
    lastIdx = 0;
  const pchar0 = pattern[0];
  let pchar = pattern[0],
    prevH0 = toShort(0),
    prevCharClass = Char.NonWord,
    inGap = false;
  let Tsub = T.subarray(idx);
  let H0sub = H0.subarray(idx).subarray(0, Tsub.length),
    C0sub = C0.subarray(idx).subarray(0, Tsub.length),
    Bsub = B.subarray(idx).subarray(0, Tsub.length);

  for (let [off, char] of Tsub.entries()) {
    let charClass: Char | null = null;

    if (char <= MAX_ASCII) {
      charClass = charClassOfAscii(char);
      if (!caseSensitive && charClass === Char.Upper) {
        char += 32;
      }
    } else {
      charClass = charClassOfNonAscii(char);
      if (!caseSensitive && charClass === Char.Upper) {
        char = String.fromCodePoint(char).toLowerCase().codePointAt(0)!;
      }
      if (normalize) {
        char = normalizeRune(char);
      }
    }

    Tsub[off] = char;
    const bonus = bonusFor(prevCharClass, charClass);
    Bsub[off] = bonus;
    prevCharClass = charClass;

    if (char === pchar) {
      if (pidx < M) {
        F[pidx] = toInt(idx + off);
        pidx++;
        pchar = pattern[Math.min(pidx, M - 1)];
      }
      lastIdx = idx + off;
    }

    if (char === pchar0) {
      const score = SCORE_MATCH + bonus * BONUS_FIRST_CHAR_MULTIPLIER;
      H0sub[off] = score;
      C0sub[off] = 1;
      if (
        M === 1 &&
        ((forward && score > maxScore) || (!forward && score >= maxScore))
      ) {
        maxScore = score;
        maxScorePos = idx + off;
        // bonus is int16 but BONUS_BOUNDARY is int. It might have needed casting in other lang
        if (forward && bonus === BONUS_BOUNDARY) {
          break;
        }
      }
      inGap = false;
    } else {
      if (inGap) {
        H0sub[off] = maxInt16(prevH0 + SCORE_GAP_EXTENTION, 0);
      } else {
        H0sub[off] = maxInt16(prevH0 + SCORE_GAP_START, 0);
      }
      C0sub[off] = 0;
      inGap = true;
    }
    prevH0 = H0sub[off];
  }

  if (pidx !== M) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  if (M === 1) {
    const result: Result = {
      start: maxScorePos,
      end: maxScorePos + 1,
      // maxScore needs to be typecasted from int16 to int in other langs
      score: maxScore,
    };
    if (!withPos) {
      return [result, null];
    }
    const pos = [maxScorePos];
    return [result, pos];
  }

  // Phase 3. Fill in score matrix (H)

  // F[0] needs to be typecasted from int32 to int in other langs
  const f0 = F[0];
  const width = lastIdx - f0 + 1;
  let H: Int16Array | null = null;
  [offset16, H] = alloc16(offset16, slab, width * M);
  {
    const toCopy = H0.subarray(f0, lastIdx + 1);
    for (const [i, v] of toCopy.entries()) {
      H[i] = v;
    }
  }

  let [, C] = alloc16(offset16, slab, width * M);
  {
    const toCopy = C0.subarray(f0, lastIdx + 1);
    for (const [i, v] of toCopy.entries()) {
      C[i] = v;
    }
  }

  const Fsub = F.subarray(1);
  // TODO Psub too needs to needs to be subarray-ed not slice-d but
  // it is only being used in one place and only to retrieve data so
  // it is fine for now
  const Psub = pattern.slice(1).slice(0, Fsub.length);

  for (const [off, f] of Fsub.entries()) {
    // int32 -> int conversion needed in other lang for `f` to use

    let inGap = false;
    const pchar = Psub[off],
      pidx = off + 1,
      row = pidx * width,
      Tsub = T.subarray(f, lastIdx + 1),
      Bsub = B.subarray(f).subarray(0, Tsub.length),
      Csub = C.subarray(row + f - f0).subarray(0, Tsub.length),
      Cdiag = C.subarray(row + f - f0 - 1 - width).subarray(0, Tsub.length),
      Hsub = H.subarray(row + f - f0).subarray(0, Tsub.length),
      Hdiag = H.subarray(row + f - f0 - 1 - width).subarray(0, Tsub.length),
      Hleft = H.subarray(row + f - f0 - 1).subarray(0, Tsub.length);
    Hleft[0] = 0;

    for (const [off, char] of Tsub.entries()) {
      const col = off + f;
      let s1: Int16 = 0,
        s2: Int16 = 0,
        consecutive: Int16 = 0;

      if (inGap) {
        s2 = Hleft[off] + SCORE_GAP_EXTENTION;
      } else {
        s2 = Hleft[off] + SCORE_GAP_START;
      }

      if (pchar === char) {
        s1 = Hdiag[off] + SCORE_MATCH;
        let b = Bsub[off];
        consecutive = Cdiag[off] + 1;

        if (b === BONUS_BOUNDARY) {
          consecutive = 1;
        } else if (consecutive > 1) {
          // `consecutive` needs to be casted to int in other lang
          b = maxInt16(
            b,
            maxInt16(BONUS_CONSECUTIVE, B[col - consecutive + 1])
          );
        }

        if (s1 + b < s2) {
          s1 += Bsub[off];
          consecutive = 0;
        } else {
          s1 += b;
        }
      }
      Csub[off] = consecutive;

      inGap = s1 < s2;
      const score = maxInt16(maxInt16(s1, s2), 0);
      if (
        pidx === M - 1 &&
        ((forward && score > maxScore) || (!forward && score >= maxScore))
      ) {
        maxScore = score;
        maxScorePos = col;
      }
      Hsub[off] = score;
    }
  }

  if (DEBUG) {
    // TODO debugV2()
  }

  // Phase 4. (Optional) Backtrace to find character positions
  const pos = posArray(withPos, M);
  let j = f0;
  if (withPos) {
    let i = M - 1;
    j = maxScorePos;
    let preferMatch = true;

    while (true) {
      const I = i * width,
        j0 = j - f0,
        s = H[I + j0];

      let s1: Int16 = 0,
        s2: Int16 = 0;

      // F[i] needs to be casted to int in other lang
      if (i > 0 && j >= F[i]) {
        s1 = H[I - width + j0 - 1];
      }

      // F[i] needs to be casted to int in other lang
      if (j > F[i]) {
        s2 = H[I + j0 - 1];
      }

      if (s > s1 && (s > s2 || (s === s2 && preferMatch))) {
        // TODO `pos` needs a typeguard or something using `withPos`
        pos!.push(j);
        if (i === 0) {
          break;
        }
        i--;
      }

      preferMatch =
        C[I + j0] > 1 ||
        (I + width + j0 + 1 < C.length && C[I + width + j0 + 1] > 0);
      j--;
    }
  }

  // maxScore needs to be typecasted in other lang to `int`
  return [{ start: j, end: maxScorePos + 1, score: maxScore }, pos];
};

function calculateScore(
  caseSensitive: boolean,
  normalize: boolean,
  text: Rune[],
  pattern: Rune[],
  sidx: number,
  eidx: number,
  withPos: boolean
): [number, number[] | null] {
  let pidx = 0,
    score = 0,
    inGap = false,
    consecutive = 0,
    firstBonus = toShort(0);

  const pos = posArray(withPos, pattern.length);
  let prevCharClass = Char.NonWord;

  if (sidx > 0) {
    prevCharClass = charClassOf(text[sidx - 1]);
  }

  for (let idx = sidx; idx < eidx; idx++) {
    let rune = text[idx];
    const charClass = charClassOf(rune);

    if (!caseSensitive) {
      if (rune >= CAPITAL_A_RUNE && rune <= CAPITAL_Z_RUNE) {
        rune += 32;
      } else if (rune > MAX_ASCII) {
        rune = String.fromCodePoint(rune).toLowerCase().codePointAt(0)!;
      }
    }

    if (normalize) {
      rune = normalizeRune(rune);
    }

    if (rune === pattern[pidx]) {
      if (withPos) {
        // TODO needs typeguard
        pos?.push(idx);
      }

      score += SCORE_MATCH;
      let bonus = bonusFor(prevCharClass, charClass);

      if (consecutive === 0) {
        firstBonus = bonus;
      } else {
        if (bonus === BONUS_BOUNDARY) {
          firstBonus = bonus;
        }
        bonus = maxInt16(maxInt16(bonus, firstBonus), BONUS_CONSECUTIVE);
      }

      if (pidx === 0) {
        // whole RHS needs to be casted to int in other lang
        score += bonus * BONUS_FIRST_CHAR_MULTIPLIER;
      } else {
        // whole RHS needs to be casted to int in other lang
        score += bonus;
      }

      inGap = false;
      consecutive++;
      pidx++;
    } else {
      if (inGap) {
        score += SCORE_GAP_EXTENTION;
      } else {
        score += SCORE_GAP_START;
      }

      inGap = true;
      consecutive = 0;
      firstBonus = 0;
    }
    prevCharClass = charClass;
  }
  return [score, pos];
}

export const fuzzyMatchV1: AlgoFn = (
  caseSensitive,
  normalize,
  forward,
  text,
  pattern,
  withPos,
  slab
) => {
  if (pattern.length === 0) {
    return [{ start: 0, end: 0, score: 0 }, null];
  }

  if (asciiFuzzyIndex(text, pattern, caseSensitive) < 0) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  let pidx = 0,
    sidx = -1,
    eidx = -1;

  const lenRunes = text.length;
  const lenPattern = pattern.length;

  for (let index = 0; index < lenRunes; index++) {
    let rune = text[indexAt(index, lenRunes, forward)];

    if (!caseSensitive) {
      if (rune >= CAPITAL_A_RUNE && rune <= CAPITAL_Z_RUNE) {
        rune += 32;
      } else if (rune > MAX_ASCII) {
        rune = String.fromCodePoint(rune).toLowerCase().codePointAt(0)!;
      }
    }

    if (normalize) {
      rune = normalizeRune(rune);
    }

    const pchar = pattern[indexAt(pidx, lenPattern, forward)];

    if (rune === pchar) {
      if (sidx < 0) {
        sidx = index;
      }

      pidx++;
      if (pidx === lenPattern) {
        eidx = index + 1;
        break;
      }
    }
  }

  if (sidx >= 0 && eidx >= 0) {
    pidx--;

    for (let index = eidx - 1; index >= sidx; index--) {
      const tidx = indexAt(index, lenRunes, forward);
      let rune = text[tidx];

      if (!caseSensitive) {
        if (rune >= CAPITAL_A_RUNE && rune <= CAPITAL_Z_RUNE) {
          rune += 32;
        } else if (rune > MAX_ASCII) {
          rune = String.fromCodePoint(rune).toLowerCase().codePointAt(0)!;
        }
      }

      const pidx_ = indexAt(pidx, lenPattern, forward);
      const pchar = pattern[pidx_];

      if (rune === pchar) {
        pidx--;
        if (pidx < 0) {
          sidx = index;
          break;
        }
      }
    }

    if (!forward) {
      const sidxTemp = sidx;
      sidx = lenRunes - eidx;
      eidx = lenRunes - sidxTemp;
    }

    const [score, pos] = calculateScore(
      caseSensitive,
      normalize,
      text,
      pattern,
      sidx,
      eidx,
      withPos
    );
    return [{ start: sidx, end: eidx, score }, pos];
  }

  return [{ start: -1, end: -1, score: 0 }, null];
};

export const exactMatchNaive: AlgoFn = (
  caseSensitive,
  normalize,
  forward,
  text,
  pattern,
  withPos,
  slab
) => {
  if (pattern.length === 0) {
    return [{ start: 0, end: 0, score: 0 }, null];
  }

  const lenRunes = text.length;
  const lenPattern = pattern.length;

  if (lenRunes < lenPattern) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  if (asciiFuzzyIndex(text, pattern, caseSensitive) < 0) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  let pidx = 0;
  let bestPos = -1,
    bonus = toShort(0),
    bestBonus = toShort(-1);

  for (let index = 0; index < lenRunes; index++) {
    const index_ = indexAt(index, lenRunes, forward);
    let rune = text[index_];

    if (!caseSensitive) {
      if (rune >= CAPITAL_A_RUNE && rune <= CAPITAL_Z_RUNE) {
        rune += 32;
      } else if (rune > MAX_ASCII) {
        rune = String.fromCodePoint(rune).toLowerCase().codePointAt(0)!;
      }
    }

    if (normalize) {
      rune = normalizeRune(rune);
    }

    const pidx_ = indexAt(pidx, lenPattern, forward);
    const pchar = pattern[pidx_];

    if (pchar === rune) {
      if (pidx_ === 0) {
        bonus = bonusAt(text, index_);
      }

      pidx++;
      if (pidx === lenPattern) {
        if (bonus > bestBonus) {
          bestPos = index;
          bestBonus = bonus;
        }

        if (bonus === BONUS_BOUNDARY) {
          break;
        }

        index -= pidx - 1;
        pidx = 0;
        bonus = 0;
      }
    } else {
      index -= pidx;
      pidx = 0;
      bonus = 0;
    }
  }

  if (bestPos >= 0) {
    let sidx = 0,
      eidx = 0;

    if (forward) {
      sidx = bestPos - lenPattern + 1;
      eidx = bestPos + 1;
    } else {
      sidx = lenRunes - (bestPos + 1);
      eidx = lenRunes - (bestPos - lenPattern + 1);
    }

    const [score] = calculateScore(
      caseSensitive,
      normalize,
      text,
      pattern,
      sidx,
      eidx,
      false
    );
    return [{ start: sidx, end: eidx, score }, null];
  }

  return [{ start: -1, end: -1, score: 0 }, null];
};

export const prefixMatch: AlgoFn = (
  caseSensitive,
  normalize,
  forward,
  text,
  pattern,
  withPos,
  slab
) => {
  if (pattern.length === 0) {
    return [{ start: 0, end: 0, score: 0 }, null];
  }

  let trimmedLen = 0;
  // check if pattern[0] is not a whitespace
  if (String.fromCodePoint(pattern[0]).match(/\s/) === null) {
    trimmedLen = whitespacesAtStart(text);
  }

  if (text.length - trimmedLen < pattern.length) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  for (const [index, r] of pattern.entries()) {
    let rune = text[trimmedLen + index];

    if (!caseSensitive) {
      rune = String.fromCodePoint(rune).toLowerCase().codePointAt(0)!;
    }

    if (normalize) {
      rune = normalizeRune(rune);
    }

    if (rune !== r) {
      return [{ start: -1, end: -1, score: 0 }, null];
    }
  }

  const lenPattern = pattern.length;
  const [score] = calculateScore(
    caseSensitive,
    normalize,
    text,
    pattern,
    trimmedLen,
    trimmedLen + lenPattern,
    false
  );
  return [{ start: trimmedLen, end: trimmedLen + lenPattern, score }, null];
};

export const suffixMatch: AlgoFn = (
  caseSensitive,
  normalize,
  forward,
  text,
  pattern,
  withPos,
  slab
) => {
  const lenRunes = text.length;
  let trimmedLen = lenRunes;

  if (
    pattern.length === 0 ||
    String.fromCodePoint(pattern[pattern.length - 1]).match(/\s/) ===
      null /* last el in pattern is not a space */
  ) {
    trimmedLen -= whitespacesAtEnd(text);
  }

  if (pattern.length === 0) {
    // TODO what?? start and end are same... is this right?
    return [{ start: trimmedLen, end: trimmedLen, score: 0 }, null];
  }

  const diff = trimmedLen - pattern.length;
  if (diff < 0) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  for (const [index, r] of pattern.entries()) {
    let rune = text[index + diff];

    if (!caseSensitive) {
      rune = String.fromCodePoint(rune).toLowerCase().codePointAt(0)!;
    }

    if (normalize) {
      rune = normalizeRune(rune);
    }

    if (rune !== r) {
      return [{ start: -1, end: -1, score: 0 }, null];
    }
  }

  const lenPattern = pattern.length;
  const sidx = trimmedLen - lenPattern;
  const eidx = trimmedLen;
  const [score] = calculateScore(
    caseSensitive,
    normalize,
    text,
    pattern,
    sidx,
    eidx,
    false
  );
  return [{ start: sidx, end: eidx, score }, null];
};

export const equalMatch: AlgoFn = (
  caseSensitive,
  normalize,
  forward,
  text,
  pattern,
  withPos,
  slab
) => {
  const lenPattern = pattern.length;
  if (lenPattern === 0) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  let trimmedLen = 0;
  // check if first el in pattern is not a whitespace
  if (String.fromCodePoint(pattern[0]).match(/\s/) === null) {
    trimmedLen = whitespacesAtStart(text);
  }

  let trimmedEndLen = 0;
  if (String.fromCodePoint(pattern[lenPattern - 1]).match(/\s/) === null) {
    trimmedEndLen = whitespacesAtEnd(text);
  }

  if (text.length - trimmedLen - trimmedEndLen != lenPattern) {
    return [{ start: -1, end: -1, score: 0 }, null];
  }

  let match = true;
  if (normalize) {
    const runes = text;

    for (const [idx, pchar] of pattern.entries()) {
      let rune = runes[trimmedLen + idx];

      if (!caseSensitive) {
        rune = String.fromCodePoint(rune).toLowerCase().codePointAt(0)!;
      }

      if (normalizeRune(pchar) !== normalizeRune(rune)) {
        match = false;
        break;
      }
    }
  } else {
    let runesStr = runesToStr(text).substring(
      trimmedLen,
      text.length - trimmedEndLen
    );

    if (!caseSensitive) {
      runesStr = runesStr.toLowerCase();
    }

    match = runesStr === runesToStr(pattern);
  }

  if (match) {
    return [
      {
        start: trimmedLen,
        end: trimmedLen + lenPattern,
        score:
          (SCORE_MATCH + BONUS_BOUNDARY) * lenPattern +
          (BONUS_FIRST_CHAR_MULTIPLIER - 1) * BONUS_BOUNDARY,
      },
      null,
    ];
  }

  return [{ start: -1, end: -1, score: 0 }, null];
};
