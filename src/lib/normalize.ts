import { Rune } from "./runes";

const normalized: Record<number, string> = {
  0x00d8: "O",
  0x00df: "s",
  0x00f8: "o",
  0x0111: "d",
  0x0127: "h",
  0x0131: "i",
  0x0140: "l",
  0x0142: "l",
  0x0167: "t",
  0x017f: "s",
  0x0180: "b",
  0x0181: "B",
  0x0183: "b",
  0x0186: "O",
  0x0188: "c",
  0x0189: "D",
  0x018a: "D",
  0x018c: "d",
  0x018e: "E",
  0x0190: "E",
  0x0192: "f",
  0x0193: "G",
  0x0197: "I",
  0x0199: "k",
  0x019a: "l",
  0x019c: "M",
  0x019d: "N",
  0x019e: "n",
  0x019f: "O",
  0x01a5: "p",
  0x01ab: "t",
  0x01ad: "t",
  0x01ae: "T",
  0x01b2: "V",
  0x01b4: "y",
  0x01b6: "z",
  0x01dd: "e",
  0x01e5: "g",
  0x0220: "N",
  0x0221: "d",
  0x0225: "z",
  0x0234: "l",
  0x0235: "n",
  0x0236: "t",
  0x0237: "j",
  0x023a: "A",
  0x023b: "C",
  0x023c: "c",
  0x023d: "L",
  0x023e: "T",
  0x023f: "s",
  0x0240: "z",
  0x0243: "B",
  0x0244: "U",
  0x0245: "V",
  0x0246: "E",
  0x0247: "e",
  0x0248: "J",
  0x0249: "j",
  0x024a: "Q",
  0x024b: "q",
  0x024c: "R",
  0x024d: "r",
  0x024e: "Y",
  0x024f: "y",
  0x0250: "a",
  0x0251: "a",
  0x0253: "b",
  0x0254: "o",
  0x0255: "c",
  0x0256: "d",
  0x0257: "d",
  0x0258: "e",
  0x025b: "e",
  0x025c: "e",
  0x025d: "e",
  0x025e: "e",
  0x025f: "j",
  0x0260: "g",
  0x0261: "g",
  0x0262: "G",
  0x0265: "h",
  0x0266: "h",
  0x0268: "i",
  0x026a: "I",
  0x026b: "l",
  0x026c: "l",
  0x026d: "l",
  0x026f: "m",
  0x0270: "m",
  0x0271: "m",
  0x0272: "n",
  0x0273: "n",
  0x0274: "N",
  0x0275: "o",
  0x0279: "r",
  0x027a: "r",
  0x027b: "r",
  0x027c: "r",
  0x027d: "r",
  0x027e: "r",
  0x027f: "r",
  0x0280: "R",
  0x0281: "R",
  0x0282: "s",
  0x0287: "t",
  0x0288: "t",
  0x0289: "u",
  0x028b: "v",
  0x028c: "v",
  0x028d: "w",
  0x028e: "y",
  0x028f: "Y",
  0x0290: "z",
  0x0291: "z",
  0x0297: "c",
  0x0299: "B",
  0x029a: "e",
  0x029b: "G",
  0x029c: "H",
  0x029d: "j",
  0x029e: "k",
  0x029f: "L",
  0x02a0: "q",
  0x02ae: "h",
  0x0363: "a",
  0x0364: "e",
  0x0365: "i",
  0x0366: "o",
  0x0367: "u",
  0x0368: "c",
  0x0369: "d",
  0x036a: "h",
  0x036b: "m",
  0x036c: "r",
  0x036d: "t",
  0x036e: "v",
  0x036f: "x",
  0x1d00: "A",
  0x1d03: "B",
  0x1d04: "C",
  0x1d05: "D",
  0x1d07: "E",
  0x1d08: "e",
  0x1d09: "i",
  0x1d0a: "J",
  0x1d0b: "K",
  0x1d0c: "L",
  0x1d0d: "M",
  0x1d0e: "N",
  0x1d0f: "O",
  0x1d10: "O",
  0x1d11: "o",
  0x1d12: "o",
  0x1d13: "o",
  0x1d16: "o",
  0x1d17: "o",
  0x1d18: "P",
  0x1d19: "R",
  0x1d1a: "R",
  0x1d1b: "T",
  0x1d1c: "U",
  0x1d1d: "u",
  0x1d1e: "u",
  0x1d1f: "m",
  0x1d20: "V",
  0x1d21: "W",
  0x1d22: "Z",
  0x1d62: "i",
  0x1d63: "r",
  0x1d64: "u",
  0x1d65: "v",
  0x1e9a: "a",
  0x1e9b: "s",
  0x2071: "i",
  0x2095: "h",
  0x2096: "k",
  0x2097: "l",
  0x2098: "m",
  0x2099: "n",
  0x209a: "p",
  0x209b: "s",
  0x209c: "t",
  0x2184: "c",

  7844: "A", // Ấ
  7845: "a", // ấ
  7846: "A", // Ầ
  7847: "a", // ầ
  7848: "A", // Ẩ
  7849: "a", // ẩ
  7850: "A", // Ẫ
  7851: "a", // ẫ
  7852: "A", // Ậ
  7853: "a", // ậ
  7854: "A", // Ắ
  7855: "a", // ắ
  7856: "A", // Ằ
  7857: "a", // ằ
  7858: "A", // Ẳ
  7859: "a", // ẳ
  7860: "A", // Ẵ
  7861: "a", // ẵ
  7862: "A", // Ặ
  7863: "a", // ặ

  7870: "E", // Ế
  7871: "e", // ế
  7872: "E", // Ề
  7873: "e", // ề
  7874: "E", // Ể
  7875: "e", // ể
  7876: "E", // Ễ
  7877: "e", // ễ
  7878: "E", // Ệ
  7879: "e", // ệ

  7888: "O", // Ố
  7889: "o", // ố
  7890: "O", // Ồ
  7891: "o", // ồ
  7892: "O", // Ổ
  7893: "o", // ổ
  7894: "O", // Ỗ
  7895: "o", // ỗ
  7896: "O", // Ộ
  7897: "o", // ộ
  7898: "O", // Ớ
  7899: "o", // ớ
  7900: "O", // Ờ
  7901: "o", // ờ
  7902: "O", // Ở
  7903: "o", // ở
  7904: "O", // Ỡ
  7905: "o", // ỡ
  7906: "O", // Ợ
  7907: "o", // ợ

  7912: "U", // Ứ
  7913: "u", // ứ
  7914: "U", // Ừ
  7915: "u", // ừ
  7916: "U", // Ử
  7917: "u", // ử
  7918: "U", // Ữ
  7919: "u", // ữ
  7920: "U", // Ự
  7921: "u", // ự
};

for (let i = "\u0300".codePointAt(0)!; i <= "\u036F".codePointAt(0)!; ++i) {
  for (const asciiChar of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") {
    const withDiacritic = (asciiChar + String.fromCodePoint(i)).normalize(
      "NFC"
    );
    const withDiacriticCodePoint = withDiacritic.codePointAt(0)!;
    if (withDiacriticCodePoint > 126) {
      normalized[withDiacriticCodePoint] = asciiChar;
    }
  }
}

export function normalizeRune(rune: Rune): Rune {
  if (rune < 0x00c0 || rune > 0x2184) {
    return rune;
  }

  // while a char can be converted to hex using str.charCodeAt().toString(16), it is not needed
  // because in `normalized` map those hex in keys will be converted to decimals.
  // Also we are passing a number instead of a converting a char so the above line doesn't apply (and that
  // we are using codePointAt instead of charCodeAt)
  const normalizedChar = normalized[rune];
  if (normalizedChar !== undefined) return normalizedChar.codePointAt(0)!;

  return rune;
}
