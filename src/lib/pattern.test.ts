import { buildPatternForExtendedSearch, TermType } from "./pattern";

// from junegunn/fzf's TestParseTermsExtended
test("buildPatternForExtendedSearch for fuzzy match", () => {
  const { termSets: terms } = buildPatternForExtendedSearch(
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
test("buildPatternForExtendedSearch for exact match", () => {
  const { termSets: terms } = buildPatternForExtendedSearch(
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

test("buildPatternForExtendedSearch for empty string", () => {
  const { termSets: terms } = buildPatternForExtendedSearch(
    true,
    "smart-case",
    false,
    "' ^ !' !^"
  );
  expect(terms.length).toBe(0);
});
