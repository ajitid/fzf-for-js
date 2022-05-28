import { Rune } from "./runes";

// values for `\s` from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet
const whitespaceRunes = new Set(
  " \f\n\r\t\v\u00a0\u1680\u2028\u2029\u202f\u205f\u3000\ufeff"
    .split("")
    .map((v) => v.codePointAt(0)!)
);
for (let codePoint = "\u2000".codePointAt(0)!; codePoint <= "\u200a".codePointAt(0)!; codePoint++) {
  whitespaceRunes.add(codePoint);
}

export const isWhitespace = (rune: Rune) => whitespaceRunes.has(rune);

export const whitespacesAtStart = (runes: Rune[]) => {
  let whitespaces = 0;

  for (const rune of runes) {
    if (isWhitespace(rune)) whitespaces++;
    else break;
  }

  return whitespaces;
};

export const whitespacesAtEnd = (runes: Rune[]) => {
  let whitespaces = 0;

  for (let i = runes.length - 1; i >= 0; i--) {
    if (isWhitespace(runes[i])) whitespaces++;
    else break;
  }

  return whitespaces;
};
