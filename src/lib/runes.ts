export const strToRunes = (str: string): Int32Array => {
  const runes = new Int32Array(str.length);
  for (let i = 0, len = str.length; i < len; ++i) {
    runes[i] = str.codePointAt(i)!;
  }
  return runes;
};

export const runesToStr = (runes: Int32Array) => String.fromCodePoint(...runes);
