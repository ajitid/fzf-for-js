import { Rune } from "./runes";

enum AlgTypes {
  Fuzzy,
  Exact,
  Prefix,
  Suffix,
  Equal,
}

interface TermT {
  typ: AlgTypes;
  inv: boolean;
  rune: Rune;
  text: string;
  caseSensitive: boolean;
}

// interface TermSetT {
//   ptr: TermT
//   size_t:
// }
