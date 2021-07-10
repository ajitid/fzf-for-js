import { fuzzyMatchV2 } from "./algo";
import { strToRunes } from "./runes";
/*
  `Result` type needs to be imported otherwise TS will complain while generating types.
  See https://github.com/microsoft/TypeScript/issues/5711
  and https://github.com/microsoft/TypeScript/issues/9944.
*/
import type { Result } from "./algo";

export const fzf = (list: string[], query: string) => {
  const pattern = strToRunes(query);

  return list.map((item) => {
    const match = fuzzyMatchV2(false, false, false, item, pattern, true, null);
    return { item, result: match[0], pos: match[1] };
  });
};
