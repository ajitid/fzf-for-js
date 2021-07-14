import * as Comlink from "comlink";

import { fuzzyMatchV2 } from "../../lib/algo";
import { FzfResultItem } from "../../lib/main";
import { strToRunes } from "../../lib/runes";
import { slab } from "../../lib/slab";

const fzfQuick = (query: string) => {
  let caseSensitive = false;
  // smartcase
  if (query.toLowerCase() !== query) {
    caseSensitive = true;
  }

  const runes = strToRunes(query);

  return (text: string): FzfResultItem => {
    // TODO this conversion needs to be somewhere else
    const textRunes = strToRunes(text);

    const match = fuzzyMatchV2(
      caseSensitive,
      false,
      false,
      textRunes,
      runes,
      true,
      slab
    );
    return { item: text, result: match[0], positions: match[1] };
  };
};

Comlink.expose({
  find: async (
    list: string[],
    query: string,
    cancel: () => Promise<boolean>
  ) => {
    const fzf = fzfQuick(query);
    const result = [];
    for (const item of list) {
      const cancelled = await cancel();
      if (cancelled) {
        return Promise.reject("stopped an fzf chunk");
      }
      result.push(fzf(item));
    }
    return result.filter((v) => v.result.score !== 0);
  },
});
