import * as Comlink from "comlink";

import { Fzf } from "../lib/main";

// import list from "../date-fns.json";
// TODO revert to date-fns list
const list = new Array(999999).fill("abcde");
const fzf = new Fzf(list, { maxResultItems: 32 });

const fzfFind = (query: string) => {
  return fzf.find(query);
};

Comlink.expose(fzfFind);
