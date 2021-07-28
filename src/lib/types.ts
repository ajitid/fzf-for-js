import type { Result } from "./algo";
import type { Options } from "./main";

export type Casing = "smart-case" | "case-sensitive" | "case-insensitive";

export interface FzfResultItem<U = string> extends Result {
  item: U;
  positions: number[] | null;
}

export type Tiebreaker<U> = (
  a: FzfResultItem<U>,
  b: FzfResultItem<U>,
  options: Options<U>
) => number;
