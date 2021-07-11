import * as Comlink from "comlink";

import { fzf } from "../lib/main";

// import list from "../date-fns.json";
// TODO revert to date-fns list
const list = new Array(999999).fill("abcde");

const cache: Record<string, ReturnType<typeof fzf>> = {};

const fzfToExport = (query: string) => {
  const resultFromCache = cache[query];
  if (resultFromCache === undefined) {
    const result = fzf(list, query);
    const sliced = result.slice(0, 32);
    cache[query] = sliced;
    return sliced;
  } else {
    return resultFromCache;
  }
};

Comlink.expose(fzfToExport);
