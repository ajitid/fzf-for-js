import { Int32 } from "./numerics";

export type Rune = Int32;

// This fn should give Int32[] not number[] but this is still okay in current
// state as not many times a rune array is intended to be subarray-ed in the
// code.
export const strToRunes = (str: string) =>
  str.split("").map((s) => s.codePointAt(0)!);
export const runesToStr = (runes: Rune[]) =>
  runes.map((r) => String.fromCodePoint(r)).join("");
