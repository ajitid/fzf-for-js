import * as Comlink from "comlink";

import { fzfQuick } from "../../lib/main";

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
