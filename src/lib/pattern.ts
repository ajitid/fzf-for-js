import {
  equalMatch,
  exactMatchNaive,
  fuzzyMatchV2,
  prefixMatch,
  suffixMatch,
} from "./algo";
import { normalizeRune } from "./normalize";
import { Rune, runesToStr, strToRunes } from "./runes";
import { Casing } from "./types";

export enum TermType {
  Fuzzy,
  Exact,
  Prefix,
  Suffix,
  Equal,
}

export const termTypeMap = {
  [TermType.Fuzzy]: fuzzyMatchV2,
  [TermType.Exact]: exactMatchNaive,
  [TermType.Prefix]: prefixMatch,
  [TermType.Suffix]: suffixMatch,
  [TermType.Equal]: equalMatch,
};

interface Term {
  typ: TermType;
  inv: boolean;
  text: Rune[];
  caseSensitive: boolean;
  normalize: boolean;
}

type TermSet = Term[];

export function buildPatternForExtendedSearch(
  fuzzy: boolean,
  caseMode: Casing,
  normalize: boolean,
  str: string
) {
  // TODO Implement caching here and below.
  // cacheable is received from caller of this fn
  let cacheable = true;

  str = str.trimLeft();

  // while(str.endsWith(' ') && !str.endsWith('\\ ')) {
  //   str= str.substring(0, str.length - 1)
  // }
  // ^^ simplified below:
  {
    const trimmedAtRightStr = str.trimRight();
    if (
      trimmedAtRightStr.endsWith("\\") &&
      str[trimmedAtRightStr.length] === " "
    ) {
      str = trimmedAtRightStr + " ";
    } else {
      str = trimmedAtRightStr;
    }
  }

  // TODO cache not implemented here
  // https://github.com/junegunn/fzf/blob/7191ebb615f5d6ebbf51d598d8ec853a65e2274d/src/pattern.go#L100-L103
  // to implement cache, search for all cache word uses in pattern.go

  // sortable turns to false initially in junegunn/fzf for extended matches
  let sortable = false;
  let termSets: TermSet[] = [];

  termSets = parseTerms(fuzzy, caseMode, normalize, str);

  Loop: for (const termSet of termSets) {
    for (const [idx, term] of termSet.entries()) {
      if (!term.inv) {
        sortable = true;
      }

      if (
        !cacheable ||
        idx > 0 ||
        term.inv ||
        (fuzzy && term.typ !== TermType.Fuzzy) ||
        (!fuzzy && term.typ !== TermType.Exact)
      ) {
        cacheable = false;
        if (sortable) {
          break Loop;
        }
      }
    }
  }

  return {
    // case sensitive will always remain true for extended match
    // caseSensitive: true,

    // this modified str can be used as cache as pattern cache
    // see https://github.com/junegunn/fzf/blob/7191ebb615f5d6ebbf51d598d8ec853a65e2274d/src/pattern.go#L100
    //
    // there is also buildCacheKey https://github.com/junegunn/fzf/blob/7191ebb615f5d6ebbf51d598d8ec853a65e2274d/src/pattern.go#L261
    // which i believe has a different purpose

    str,
    // ^ this in junegunn/fzf is `text: []rune(asString)`

    termSets,
    sortable,
    cacheable,
    fuzzy,
  };
}

function parseTerms(
  fuzzy: boolean,
  caseMode: Casing,
  normalize: boolean,
  str: string
): TermSet[] {
  // <backslash><space> to a <tab>
  str = str.replaceAll("\\ ", "\t");
  // split on space groups
  const tokens = str.split(/ +/);

  const sets: TermSet[] = [];
  let set: TermSet = [];
  let switchSet = false;
  let afterBar = false;

  for (const token of tokens) {
    let typ = TermType.Fuzzy,
      inv = false,
      text = token.replaceAll("\t", " ");
    const lowerText = text.toLowerCase();

    const caseSensitive =
      caseMode === "case-sensitive" ||
      (caseMode === "smart-case" && text !== lowerText);

    // TODO double conversion here, could be simplified
    const normalizeTerm =
      normalize &&
      lowerText === runesToStr(strToRunes(lowerText).map(normalizeRune));

    if (!caseSensitive) {
      text = lowerText;
    }

    if (!fuzzy) {
      typ = TermType.Exact;
    }

    if (set.length > 0 && !afterBar && text === "|") {
      switchSet = false;
      afterBar = true;
      continue;
    }
    afterBar = false;

    if (text.startsWith("!")) {
      inv = true;
      typ = TermType.Exact;
      text = text.substring(1);
    }

    if (text !== "$" && text.endsWith("$")) {
      typ = TermType.Suffix;
      text = text.substring(0, text.length - 1);
    }

    if (text.startsWith("'")) {
      if (fuzzy && !inv) {
        typ = TermType.Exact;
      } else {
        typ = TermType.Fuzzy;
      }
      text = text.substring(1);
    } else if (text.startsWith("^")) {
      if (typ === TermType.Suffix) {
        typ = TermType.Equal;
      } else {
        typ = TermType.Prefix;
      }
      text = text.substring(1);
    }

    if (text.length > 0) {
      if (switchSet) {
        sets.push(set);
        set = [];
      }
      let textRunes = strToRunes(text);
      if (normalizeTerm) {
        textRunes = textRunes.map(normalizeRune);
      }

      set.push({
        typ,
        inv,
        text: textRunes,
        caseSensitive,
        normalize: normalizeTerm,
      });
      switchSet = true;
    }
  }

  if (set.length > 0) {
    sets.push(set);
  }

  return sets;
}
