import * as Comlink from "comlink";

import { Fzf } from "../../lib/main";

Comlink.expose({
  find: (list: string[], query: string) => {
    const fzf = new Fzf(list, { cache: false, sort: false });
    return fzf.find(query);
  },
});
