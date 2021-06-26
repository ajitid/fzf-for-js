// porting FZF at commit hash 7191ebb615f5d6ebbf51d598d8ec853a65e2274d of junegunn/fzf
// and using https://github.com/nvim-telescope/telescope-fzf-native.nvim/blob/f0379f50aa79a2bf028340067e443a3079b29d54/src/fzf.c
// for extra reference

import { normalized } from "./normalize";
import { Slab } from "./utils/slab";

type Int16 = Int16Array[0];
type Int32 = Int32Array[0];
type Rune = Int32;

function indexAt(index: number, max: number, forward: boolean) {
  if (forward) {
    return index;
  }

  return max - index - 1;
}

interface Result {
  // TODO from junegunn/fzf - int32 should suffice
  start: number;
  end: number;
  score: number;
}

const SCORE_MATCH = 16,
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
    const pos = new Array(len).fill(0);
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
    const slice = slab.i16.slice(offset, offset + size);
    return [offset + size, slice];
  }

  return [offset, new Int16Array(size)];
}

function alloc32(
  offset: number,
  slab: Slab | null,
  size: number
): [number, Int32Array] {
  if (slab !== null && slab.i32.length > offset + size) {
    const slice = slab.i32.slice(offset, offset + size);
    return [offset + size, slice];
  }

  return [offset, new Int32Array(size)];
}

// rune is type int32 in Golang https://blog.golang.org/strings#TOC_5.
// and represents a character. In JavaScript, rune will be
// int32 [Go] == 'a'.codePointAt(0) [JS] == 97 [number]
//
// TODO We are considering passed argument `rune` as string here and use
// rune[0] to denote char (which, I know, is a string)
// need to eliminate this unnecessary indexing.
//
// Also I'm considering `input` arg as a string not an array of chars,
// this might led to creation of too many strings in string pool resulting in
// huge garbage collection. JS can't parse it in terms of bytes so I might need to use
// char array instead (which will technically be string array)
function charClassOfAscii(rune: Rune): Char {
  const char = String.fromCodePoint(rune);

  if (char >= "a" && char <= "z") {
    return Char.Lower;
  } else if (char >= "A" && char <= "Z") {
    return Char.Upper;
  } else if (char >= "0" && char <= "9") {
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

const MAX_ASCII = "\u007F".codePointAt(0)!;

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

function bonusAt(input: string, idx: number): Int16 {
  if (idx === 0) {
    return BONUS_BOUNDARY;
  }

  return bonusFor(
    charClassOf(input[idx - 1].codePointAt(0)!),
    charClassOf(input[idx].codePointAt(0)!)
  );
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

type AlgoFn = (
  caseSensitive: boolean,
  normalize: boolean,
  forward: boolean,
  input: string,
  pattern: Rune[],
  withPos: boolean,
  slab: Slab | null
) => [Result, number[] | null];

function trySkip(
  input: string,
  caseSensitive: boolean,
  char: string,
  from: number
): number {
  let rest = input.substring(from);
  let idx = rest.indexOf(char);
  if (idx === 0) {
    return from;
  }

  if (!caseSensitive && char >= "a" && char <= "z") {
    if (idx > 0) {
      rest = rest.substring(0, idx);
    }

    // TODO I hope that I'm doing it right
    // convert ascii lower to upper by subtracting 32 (a -> A)
    // and then checking if it is present in str
    // dunno, this logic looks odd
    const uidx = rest.indexOf(String.fromCodePoint(char.codePointAt(0)! - 32));
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
  input: string,
  pattern: Rune[],
  caseSensitive: boolean
): number {
  // TODO there is a condition that returns 0 which I didn't used (not present in telescope-fzf-native either)
  // check if it is needed

  if (!isAscii(pattern)) {
    return -1;
  }

  let firstIdx = 0,
    idx = 0;

  for (let pidx = 0; pidx < pattern.length; pidx++) {
    idx = trySkip(
      input,
      caseSensitive,
      String.fromCodePoint(pattern[pidx]),
      idx
    );
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

function debugV2() {
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
    T[i] = input.codePointAt(i)!;
  }

  // Phase 2. Calculate bonus for each point
};
