import { equalMatch, exactMatchNaive } from "../algo";
import { buildPatternForExtendedMatch, TermType } from "../pattern";
import { strToRunes } from "../runes";

import "jest-expect-message";

// from junegunn/fzf's TestParseTermsExtended
test("buildPatternForExtendedMatch for fuzzy match", () => {
  const { termSets: terms } = buildPatternForExtendedMatch(
    true,
    "smart-case",
    false,
    "aaa 'bbb ^ccc ddd$ !eee !'fff !^ggg !hhh$ | ^iii$ ^xxx | 'yyy | zzz$ | !ZZZ |"
  );

  expect(terms.length).toBe(9);

  expect(terms[0][0].typ).toBe(TermType.Fuzzy);
  expect(terms[1][0].typ).toBe(TermType.Exact);
  expect(terms[2][0].typ).toBe(TermType.Prefix);
  expect(terms[3][0].typ).toBe(TermType.Suffix);
  expect(terms[4][0].typ).toBe(TermType.Exact);
  expect(terms[5][0].typ).toBe(TermType.Fuzzy);
  expect(terms[6][0].typ).toBe(TermType.Prefix);
  expect(terms[7][0].typ).toBe(TermType.Suffix);
  expect(terms[7][1].typ).toBe(TermType.Equal);
  expect(terms[8][0].typ).toBe(TermType.Prefix);
  expect(terms[8][1].typ).toBe(TermType.Exact);
  expect(terms[8][2].typ).toBe(TermType.Suffix);
  expect(terms[8][3].typ).toBe(TermType.Exact);

  expect(terms[0][0].inv).toBeFalsy();
  expect(terms[1][0].inv).toBeFalsy();
  expect(terms[2][0].inv).toBeFalsy();
  expect(terms[3][0].inv).toBeFalsy();

  expect(!terms[4][0].inv).toBeFalsy();
  expect(!terms[5][0].inv).toBeFalsy();
  expect(!terms[6][0].inv).toBeFalsy();
  expect(!terms[7][0].inv).toBeFalsy();

  expect(terms[7][1].inv).toBeFalsy();
  expect(terms[8][0].inv).toBeFalsy();
  expect(terms[8][1].inv).toBeFalsy();
  expect(terms[8][2].inv).toBeFalsy();

  expect(!terms[8][3].inv).toBeFalsy();

  for (const termSet of terms.slice(0, 8)) {
    const term = termSet[0];
    expect(term.text.length !== 3).toBeFalsy();
  }
});

// from junegunn/fzf's TestParseTermsExtendedExact
test("buildPatternForExtendedMatch for exact match", () => {
  const { termSets: terms } = buildPatternForExtendedMatch(
    false,
    "smart-case",
    false,
    "aaa 'bbb ^ccc ddd$ !eee !'fff !^ggg !hhh$"
  );

  expect(terms.length).toBe(8);

  expect(terms[0][0].typ).toBe(TermType.Exact);
  expect(terms[1][0].typ).toBe(TermType.Fuzzy);
  expect(terms[2][0].typ).toBe(TermType.Prefix);
  expect(terms[3][0].typ).toBe(TermType.Suffix);
  expect(terms[4][0].typ).toBe(TermType.Exact);
  expect(terms[5][0].typ).toBe(TermType.Fuzzy);
  expect(terms[6][0].typ).toBe(TermType.Prefix);
  expect(terms[7][0].typ).toBe(TermType.Suffix);

  expect(terms[0][0].inv).toBeFalsy();
  expect(terms[1][0].inv).toBeFalsy();
  expect(terms[2][0].inv).toBeFalsy();
  expect(terms[3][0].inv).toBeFalsy();
  expect(!terms[4][0].inv).toBeFalsy();
  expect(!terms[5][0].inv).toBeFalsy();
  expect(!terms[6][0].inv).toBeFalsy();
  expect(!terms[7][0].inv).toBeFalsy();

  expect(terms[0][0].text.length).toBe(3);
  expect(terms[1][0].text.length).toBe(3);
  expect(terms[2][0].text.length).toBe(3);
  expect(terms[3][0].text.length).toBe(3);
  expect(terms[4][0].text.length).toBe(3);
  expect(terms[5][0].text.length).toBe(3);
  expect(terms[6][0].text.length).toBe(3);
  expect(terms[7][0].text.length).toBe(3);
});

test("buildPatternForExtendedMatch for empty string", () => {
  const { termSets: terms } = buildPatternForExtendedMatch(
    true,
    "smart-case",
    false,
    "' ^ !' !^"
  );
  expect(terms.length).toBe(0);
});

test("exact match", () => {
  const pattern = buildPatternForExtendedMatch(
    true,
    "smart-case",
    false,
    "abc"
  );

  const [result, positions] = exactMatchNaive(
    true,
    false,
    true,
    strToRunes("aabbcc abc"),
    pattern.termSets[0][0].text,
    true,
    null
  );
  expect(result.start).toBe(7);
  expect(result.end).toBe(10);
  expect(positions).toBe(null);
});

test("equal match", () => {
  const pattern = buildPatternForExtendedMatch(
    true,
    "smart-case",
    false,
    "^AbC$"
  );

  const match = (str: string, sidxExpected: number, eidxExpected: number) => {
    const textRunes = strToRunes(str);
    const [result, positions] = equalMatch(
      true,
      false,
      true,
      textRunes,
      pattern.termSets[0][0].text,
      true,
      null
    );

    const fail = `Failed for "${str}". See error stack to trace the function (object) call.`;
    expect(result.start, fail).toBe(sidxExpected);
    expect(result.end, fail).toBe(eidxExpected);
    expect(positions, fail).toBe(null);
  };

  match("ABC", -1, -1);
  match("AbC", 0, 3);
  match("AbC  ", 0, 3);
  match(" AbC ", 1, 4);
  match("  AbC", 2, 5);
});

/*
Above tests are from junegunn/fzf, but:
- We aren't doing junegunn/fzf TestCaseSensitivity checks as we aren't building
  a pattern for basic match and for extende matches, case sensitivity remains
  true.
- There is one for Transform (--nth) which we don't have for JS implementation
  so that is skipped.
- We aren't doing any caching for now so those are skipped too.
*/

test("tab representations are preserved on transformed string", () => {
  const match = (inputStr: string, toMatchStr: string) => {
    expect(
      buildPatternForExtendedMatch(false, "smart-case", false, inputStr).str
    ).toBe(toMatchStr);
  };

  match(" AA bb       ", "AA bb");
  match(" AA bb\\       ", "AA bb\\ ");
  match(" AA bb    \\    \\   ", "AA bb    \\    \\ ");
  match(" AA \\  bb \\   ", "AA \\  bb \\ ");

  const pattern = buildPatternForExtendedMatch(
    false,
    "smart-case",
    false,
    "a\\ b\\ "
  );
  const recvText = pattern.termSets[0][0].text;
  expect(recvText[3]).toBe(32);
  expect(recvText[3]).toBe(32);
});
