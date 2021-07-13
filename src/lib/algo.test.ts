import {
  AlgoFn,
  BONUS_CAMEL_123,
  fuzzyMatchV1,
  fuzzyMatchV2,
  SCORE_GAP_START,
  SCORE_MATCH,
  SCORE_GAP_EXTENTION,
  BONUS_FIRST_CHAR_MULTIPLIER,
  BONUS_BOUNDARY,
  BONUS_CONSECUTIVE,
  BONUS_NON_WORD,
  exactMatchNaive,
  prefixMatch,
  suffixMatch,
  equalMatch,
} from "./algo";
import { strToRunes } from "./runes";

import "jest-expect-message";

function assertMatch(
  algo: AlgoFn,
  caseSensitive: boolean,
  forward: boolean,
  input: string,
  pattern: string,
  sidx: number,
  eidx: number,
  score: number
) {
  assertMatch2(
    algo,
    caseSensitive,
    false,
    forward,
    input,
    pattern,
    sidx,
    eidx,
    score
  );
}

function assertMatch2(
  algo: AlgoFn,
  caseSensitive: boolean,
  normalize: boolean,
  forward: boolean,
  input: string,
  pattern: string,
  sidx: number,
  eidx: number,
  score: number
) {
  if (!caseSensitive) {
    pattern = pattern.toLowerCase();
  }

  const [res, pos] = algo(
    caseSensitive,
    normalize,
    forward,
    strToRunes(input),
    strToRunes(pattern),
    true,
    null
  );
  let start = 0,
    end = 0;

  if (pos === null || pos.length === 0) {
    start = res.start;
    end = res.end;
  } else {
    pos.sort((a, b) => a - b);
    start = pos[0];
    end = pos[pos.length - 1] + 1;
  }

  const msg = `INPUT ${input} :: PATTERN ${pattern} :: FORWARD ${forward}`;
  expect(start, msg).toBe(sidx);
  expect(end, msg).toBe(eidx);
  expect(res.score, msg).toBe(score);
}

it("testFuzzyMatch", () => {
  for (const algo of [fuzzyMatchV1, fuzzyMatchV2]) {
    for (const forward of [true, false]) {
      assertMatch(
        algo,
        false,
        forward,
        "fooBarbaz1",
        "oBZ",
        2,
        9,
        SCORE_MATCH * 3 +
          BONUS_CAMEL_123 +
          SCORE_GAP_START +
          SCORE_GAP_EXTENTION * 3
      );

      assertMatch(
        algo,
        false,
        forward,
        "foo bar baz",
        "fbb",
        0,
        9,
        SCORE_MATCH * 3 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_BOUNDARY * 2 +
          2 * SCORE_GAP_START +
          4 * SCORE_GAP_EXTENTION
      );

      assertMatch(
        algo,
        false,
        forward,
        "/AutomatorDocument.icns",
        "rdoc",
        9,
        13,
        SCORE_MATCH * 4 + BONUS_CAMEL_123 + BONUS_CONSECUTIVE * 2
      );

      assertMatch(
        algo,
        false,
        forward,
        "/man1/zshcompctl.1",
        "zshc",
        6,
        10,
        SCORE_MATCH * 4 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_BOUNDARY * 3
      );

      assertMatch(
        algo,
        false,
        forward,
        "/.oh-my-zsh/cache",
        "zshc",
        8,
        13,
        SCORE_MATCH * 4 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_BOUNDARY * 3 +
          SCORE_GAP_START
      );

      assertMatch(
        algo,
        false,
        forward,
        "ab0123 456",
        "12356",
        3,
        10,
        SCORE_MATCH * 5 +
          BONUS_CONSECUTIVE * 3 +
          SCORE_GAP_START +
          SCORE_GAP_EXTENTION
      );

      assertMatch(
        algo,
        false,
        forward,
        "abc123 456",
        "12356",
        3,
        10,
        SCORE_MATCH * 5 +
          BONUS_CAMEL_123 * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_CAMEL_123 * 2 +
          BONUS_CONSECUTIVE +
          SCORE_GAP_START +
          SCORE_GAP_EXTENTION
      );

      assertMatch(
        algo,
        false,
        forward,
        "foo/bar/baz",
        "fbb",
        0,
        9,
        SCORE_MATCH * 3 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_BOUNDARY * 2 +
          2 * SCORE_GAP_START +
          4 * SCORE_GAP_EXTENTION
      );

      assertMatch(
        algo,
        false,
        forward,
        "fooBarBaz",
        "fbb",
        0,
        7,
        SCORE_MATCH * 3 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_CAMEL_123 * 2 +
          2 * SCORE_GAP_START +
          2 * SCORE_GAP_EXTENTION
      );

      assertMatch(
        algo,
        false,
        forward,
        "foo barbaz",
        "fbb",
        0,
        8,
        SCORE_MATCH * 3 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_BOUNDARY +
          SCORE_GAP_START * 2 +
          SCORE_GAP_EXTENTION * 3
      );

      assertMatch(
        algo,
        false,
        forward,
        "fooBar Baz",
        "foob",
        0,
        4,
        SCORE_MATCH * 4 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_BOUNDARY * 3
      );

      assertMatch(
        algo,
        false,
        forward,
        "xFoo-Bar Baz",
        "foo-b",
        1,
        6,
        SCORE_MATCH * 5 +
          BONUS_CAMEL_123 * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_CAMEL_123 * 2 +
          BONUS_NON_WORD +
          BONUS_BOUNDARY
      );

      // more
      assertMatch(
        algo,
        true,
        forward,
        "fooBarbaz",
        "oBz",
        2,
        9,
        SCORE_MATCH * 3 +
          BONUS_CAMEL_123 +
          SCORE_GAP_START +
          SCORE_GAP_EXTENTION * 3
      );
      assertMatch(
        algo,
        true,
        forward,
        "Foo/Bar/Baz",
        "FBB",
        0,
        9,
        SCORE_MATCH * 3 +
          BONUS_BOUNDARY * (BONUS_FIRST_CHAR_MULTIPLIER + 2) +
          SCORE_GAP_START * 2 +
          SCORE_GAP_EXTENTION * 4
      );
      assertMatch(
        algo,
        true,
        forward,
        "FooBarBaz",
        "FBB",
        0,
        7,
        SCORE_MATCH * 3 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_CAMEL_123 * 2 +
          SCORE_GAP_START * 2 +
          SCORE_GAP_EXTENTION * 2
      );
      assertMatch(
        algo,
        true,
        forward,
        "FooBar Baz",
        "FooB",
        0,
        4,
        SCORE_MATCH * 4 +
          BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
          BONUS_BOUNDARY * 2 +
          Math.max(BONUS_CAMEL_123, BONUS_BOUNDARY)
      );

      // Consecutive bonus updated
      assertMatch(
        algo,
        true,
        forward,
        "foo-bar",
        "o-ba",
        2,
        6,
        SCORE_MATCH * 4 + BONUS_BOUNDARY * 3
      );

      // Non-match
      assertMatch(algo, true, forward, "fooBarbaz", "oBZ", -1, -1, 0);
      assertMatch(algo, true, forward, "Foo Bar Baz", "fbb", -1, -1, 0);
      assertMatch(algo, true, forward, "fooBarbaz", "fooBarbazz", -1, -1, 0);
    }
  }
});

it("testFuzzyMatchBackward", () => {
  assertMatch(
    fuzzyMatchV1,
    false,
    true,
    "foobar fb",
    "fb",
    0,
    4,
    SCORE_MATCH * 2 +
      BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
      SCORE_GAP_START +
      SCORE_GAP_EXTENTION
  );
  assertMatch(
    fuzzyMatchV1,
    false,
    false,
    "foobar fb",
    "fb",
    7,
    9,
    SCORE_MATCH * 2 +
      BONUS_BOUNDARY * BONUS_FIRST_CHAR_MULTIPLIER +
      BONUS_BOUNDARY
  );
});

it("testExactMatchNaive", () => {
  for (const dir of [true, false]) {
    assertMatch(exactMatchNaive, true, dir, "fooBarbaz", "oBA", -1, -1, 0);
    assertMatch(
      exactMatchNaive,
      true,
      dir,
      "fooBarbaz",
      "fooBarbazz",
      -1,
      -1,
      0
    );

    assertMatch(
      exactMatchNaive,
      false,
      dir,
      "fooBarbaz",
      "oBA",
      2,
      5,
      SCORE_MATCH * 3 + BONUS_CAMEL_123 + BONUS_CONSECUTIVE
    );
    assertMatch(
      exactMatchNaive,
      false,
      dir,
      "/AutomatorDocument.icns",
      "rdoc",
      9,
      13,
      SCORE_MATCH * 4 + BONUS_CAMEL_123 + BONUS_CONSECUTIVE * 2
    );
    assertMatch(
      exactMatchNaive,
      false,
      dir,
      "/man1/zshcompctl.1",
      "zshc",
      6,
      10,
      SCORE_MATCH * 4 + BONUS_BOUNDARY * (BONUS_FIRST_CHAR_MULTIPLIER + 3)
    );
    assertMatch(
      exactMatchNaive,
      false,
      dir,
      "/.oh-my-zsh/cache",
      "zsh/c",
      8,
      13,
      SCORE_MATCH * 5 + BONUS_BOUNDARY * (BONUS_FIRST_CHAR_MULTIPLIER + 4)
    );
  }
});

it("testExactMatchNaiveBackward", () => {
  assertMatch(
    exactMatchNaive,
    false,
    true,
    "foobar foob",
    "oo",
    1,
    3,
    SCORE_MATCH * 2 + BONUS_CONSECUTIVE
  );
  assertMatch(
    exactMatchNaive,
    false,
    false,
    "foobar foob",
    "oo",
    8,
    10,
    SCORE_MATCH * 2 + BONUS_CONSECUTIVE
  );
});

it("testPrefixMatch", () => {
  const score =
    (SCORE_MATCH + BONUS_BOUNDARY) * 3 +
    BONUS_BOUNDARY * (BONUS_FIRST_CHAR_MULTIPLIER - 1);

  for (const dir of [true, false]) {
    assertMatch(prefixMatch, true, dir, "fooBarbaz", "Foo", -1, -1, 0);
    assertMatch(prefixMatch, false, dir, "fooBarBaz", "baz", -1, -1, 0);
    assertMatch(prefixMatch, false, dir, "fooBarbaz", "Foo", 0, 3, score);
    assertMatch(prefixMatch, false, dir, "foOBarBaZ", "foo", 0, 3, score);
    assertMatch(prefixMatch, false, dir, "f-oBarbaz", "f-o", 0, 3, score);

    assertMatch(prefixMatch, false, dir, " fooBar", "foo", 1, 4, score);
    assertMatch(prefixMatch, false, dir, " fooBar", " fo", 0, 3, score);
    assertMatch(prefixMatch, false, dir, "     fo", "foo", -1, -1, 0);
  }
});

it("testSuffixMatch", () => {
  for (const dir of [true, false]) {
    assertMatch(suffixMatch, true, dir, "fooBarbaz", "Baz", -1, -1, 0);
    assertMatch(suffixMatch, false, dir, "fooBarbaz", "Foo", -1, -1, 0);

    assertMatch(
      suffixMatch,
      false,
      dir,
      "fooBarbaz",
      "baz",
      6,
      9,
      SCORE_MATCH * 3 + BONUS_CONSECUTIVE * 2
    );
    assertMatch(
      suffixMatch,
      false,
      dir,
      "fooBarBaZ",
      "baz",
      6,
      9,
      (SCORE_MATCH + BONUS_CAMEL_123) * 3 +
        BONUS_CAMEL_123 * (BONUS_FIRST_CHAR_MULTIPLIER - 1)
    );

    // Strip trailing white space from the string
    assertMatch(
      suffixMatch,
      false,
      dir,
      "fooBarbaz ",
      "baz",
      6,
      9,
      SCORE_MATCH * 3 + BONUS_CONSECUTIVE * 2
    );
    // Only when the pattern doesn't end with a space
    assertMatch(
      suffixMatch,
      false,
      dir,
      "fooBarbaz ",
      "baz ",
      6,
      10,
      SCORE_MATCH * 4 + BONUS_CONSECUTIVE * 2 + BONUS_NON_WORD
    );
  }
});

it("testEmptyPattern", () => {
  for (const dir of [true, false]) {
    assertMatch(fuzzyMatchV1, true, dir, "foobar", "", 0, 0, 0);
    assertMatch(fuzzyMatchV2, true, dir, "foobar", "", 0, 0, 0);
    assertMatch(exactMatchNaive, true, dir, "foobar", "", 0, 0, 0);
    assertMatch(prefixMatch, true, dir, "foobar", "", 0, 0, 0);
    assertMatch(suffixMatch, true, dir, "foobar", "", 6, 6, 0);
  }
});

it("testNormalize", () => {
  const caseSensitive = false;
  const normalize = true;
  const forward = true;

  const runTest = (
    input: string,
    pattern: string,
    sidx: number,
    eidx: number,
    score: number,
    ...fns: AlgoFn[]
  ) => {
    for (const fn of fns) {
      assertMatch2(
        fn,
        caseSensitive,
        normalize,
        forward,
        input,
        pattern,
        sidx,
        eidx,
        score
      );
    }
  };

  runTest(
    "Só Danço Samba",
    "So",
    0,
    2,
    56,
    fuzzyMatchV1,
    fuzzyMatchV2,
    prefixMatch,
    exactMatchNaive
  );
  runTest("Só Danço Samba", "sodc", 0, 7, 89, fuzzyMatchV1, fuzzyMatchV2);
  runTest(
    "Danço",
    "danco",
    0,
    5,
    128,
    fuzzyMatchV1,
    fuzzyMatchV2,
    prefixMatch,
    suffixMatch,
    exactMatchNaive,
    equalMatch
  );
});

const MAX_UINT_16 = 65535;
it("testLongString", () => {
  const strArr = new Array(MAX_UINT_16 * 2).fill("x");
  strArr[MAX_UINT_16] = "z";
  const str = strArr.join("");

  assertMatch(
    fuzzyMatchV2,
    true,
    true,
    str,
    "zx",
    MAX_UINT_16,
    MAX_UINT_16 + 2,
    SCORE_MATCH * 2 + BONUS_CONSECUTIVE
  );
});
