import { normalizeRune } from "./normalize";
import { Rune, runesToStr, strToRunes } from "./runes";
import { Casing } from "./types";

enum TermType {
  Fuzzy,
  Exact,
  Prefix,
  Suffix,
  Equal,
}

interface Term {
  typ: number;
  inv: boolean;
  text: Rune[];
  caseSensitive: boolean;
  normalize: boolean;
}

type TermSet = Term[];

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
        normalize,
      });
      switchSet = true;
    }
  }

  if (set.length > 0) {
    sets.push(set);
  }

  return sets;
}
