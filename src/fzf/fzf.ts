// porting FZF at commit hash 7191ebb615f5d6ebbf51d598d8ec853a65e2274d of junegunn/fzf
// and using https://github.com/nvim-telescope/telescope-fzf-native.nvim/blob/f0379f50aa79a2bf028340067e443a3079b29d54/src/fzf.c
// for extra reference

import { normalized } from "./normalize";
import { Slab } from "./utils/slab";

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
// and represents a character
//
// TODO we are considering passed argument `rune` as string here and use
// rune[0] to denote char (which, I know, is a string)
function charClassOfAscii(rune: string): Char {
  if (rune.length === 0) return Char.NonWord;

  const char = rune[0];
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

function charClassOfNonAscii(rune: string): Char {
  if (rune.length === 0) return Char.NonWord;

  const char = rune[0];
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

const MAX_ASCII = "\u007F";

function charClassOf(rune: string): Char {
  if (rune.length === 0) return charClassOfAscii(rune);

  const char = rune[0];

  if (char <= MAX_ASCII) {
    return charClassOfAscii(char);
  }

  return charClassOfNonAscii(char);
}

function bonusFor(prevClass: Char, currClass: Char): Int16Array[0] {
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

function bonusAt(input: string, idx: number): Int16Array[0] {
  if (idx === 0) {
    return BONUS_BOUNDARY;
  }

  return bonusFor(charClassOf(input[idx - 1]), charClassOf(input[idx]));
}

function normalizeRune(r: string) {
  const char = r[0];

  if (
    char < String.fromCharCode(0x00c0) ||
    char > String.fromCharCode(0x2184)
  ) {
    return r;
  }

  // while a char can be converted to hex using str.charCodeAt().toString(16), it is not needed
  // because in `normalized` map those hex in keys will be converted to decimals
  const normalizedChar = normalized[char.charCodeAt(0)];
  if (normalizedChar !== undefined) return normalizedChar;

  return char;
}

type AlgoFn = (
  caseSensitive: boolean,
  normalize: boolean,
  forward: boolean,
  input: string,
  pattern: string,
  withPos: boolean,
  slab: Slab
) => [Result, number[]];

function trySkip(
  input: string,
  caseSensitive: boolean,
  char: string,
  from: number
): number {
  let rest = input.substr(from);
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
    const uidx = rest.indexOf(String.fromCharCode(char.charCodeAt(0) - 32));
    if (uidx >= 0) {
      idx = uidx;
    }
  }

  if (idx < 0) {
    return -1;
  }

  return from + idx;
}

function isAscii(runes: string[]) {
  for (const rune of runes) {
    const char = rune[0];
    if (char.charCodeAt(0) >= 128) {
      return false;
    }
  }

  return true;
}
