import type { Result } from "./algo";
import type { Finder } from "./finder";

export type Casing = "smart-case" | "case-sensitive" | "case-insensitive";

export interface FzfResultItem<U = string> extends Result {
  item: U;
  positions: Set<number>;
}

export type Tiebreaker<U> = (
  a: FzfResultItem<U>,
  b: FzfResultItem<U>,
  options: Options<U>
) => number;

export interface Options<U> {
  /**
   * If `limit` is 32, top 32 items that matches your query will be returned.
   * By default all matched items are returned.
   *
   * @defaultValue Infinity
   */
  limit: number;
  /**
   * For each item in the list, target a specific property of the item to search for.
   */
  selector: (v: U) => string;
  /**
   * Defines what type of case sensitive search you want.
   *
   * @defaultValue "smart-case"
   */
  casing: Casing;
  /**
   * If true, FZF will try to remove diacritics from list items.
   * This is useful if the list contains items with diacritics but
   * you want to query with plain A-Z letters.
   *
   * @example
   * Zoë →  Zoe
   * blessèd →  blessed
   *
   * @defaultValue true
   */
  normalize: boolean;
  /**
   * Fuzzy algo to choose. Each algo has their own advantages, see here:
   * https://github.com/junegunn/fzf/blob/4c9cab3f8ae7b55f7124d7c3cf7ac6b4cc3db210/src/algo/algo.go#L5
   * If asssigned `false`, an exact match will be made instead of a fuzzy one.
   *
   * @defaultValue "v2"
   */
  fuzzy: "v1" | "v2" | false;
  /**
   * If true, you can add special patterns to narrow down your search.
   * To read about how they can be used, see [this section](https://github.com/junegunn/fzf/tree/7191ebb615f5d6ebbf51d598d8ec853a65e2274d#search-syntax).
   * For a quick glance, see [this piece](https://github.com/junegunn/fzf/blob/764316a53d0eb60b315f0bbcd513de58ed57a876/src/pattern.go#L12-L19).
   *
   * @defaultValue false
   */
  match: (this: Finder<U[]>, query: string) => FzfResultItem<U>[];
  /**
   * A list of functions that act as fallback and help to
   * sort result entries when the score between two entries is tied.
   *
   * Consider a tiebreaker to be a [JS array sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
   * compare function with an added third argument which is this `options` itself.
   *
   * Note that tiebreakers cannot be used if `sort=false`.
   *
   * @defaultValue []
   *
   * @example
   * ```js
   * function byLengthAsc(a, b, options) {
   *   return options.selector(a.item).length - options.selector(b.item).length;
   * }
   *
   * const fzf = new Fzf(list, { tiebreakers: [byLengthAsc] })
   * ```
   * This will result in following result entries having same score sorted like this:
   *    FROM                TO
   * axaa                axaa
   * bxbbbb              bxbbbb
   * cxcccccccccc        dxddddddd
   * dxddddddd           cxcccccccccc
   */
  tiebreakers: Tiebreaker<U>[];
  /**
   * If `true`, result items will be sorted in descending order by their score.
   * If `false`, result won't be sorted and tiebreakers won't affect the sort
   * order either.
   *
   * @defaultValue true
   */
  sort: boolean;
  /**
   * If `false`, matching will be done from backwards.
   *
   * @defaultValue true
   *
   * @example
   * /breeds/pyrenees when queried with "re"
   * with forward=true  : /b**re**eds/pyrenees
   * with forward=false : /breeds/py**re**nees
   *
   * Doing forward=false is useful, for example, if one needs to match a file
   * path and they prefer querying for the file name over directory names
   * present in the path.
   */
  forward: boolean;
}
