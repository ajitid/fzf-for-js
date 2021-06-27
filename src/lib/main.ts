import { fuzzyMatchV2 } from "./algo";
import { strToRunes } from "./runes";

export const fzf = (list: string[], query: string) => {
  const pattern = strToRunes(query);

  return list.map((item) => {
    const match = fuzzyMatchV2(false, false, false, item, pattern, true, null);
    return { item, result: match[0], pos: match[1] };
  });
};
