import { Int32 } from "./numerics";

export type Rune = Int32;

export const strToRunes = (str: string) =>
  str.split("").map((s) => s.codePointAt(0)!);
export const runesToStr = (runes: Rune[]) =>
  runes.map((r) => String.fromCodePoint(r)).join("");
