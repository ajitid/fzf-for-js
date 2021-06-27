import {
  AlgoFn,
  BONUS_CAMEL_123,
  fuzzyMatchV1,
  fuzzyMatchV2,
  SCORE_GAP_START,
  SCORE_MATCH,
  SCORE_GAP_EXTENTION,
} from "./algo";
import { strToRunes } from "./runes";

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
    input,
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
    pos.sort();
    start = pos[0];
    end = pos[pos.length - 1] + 1;
  }

  if (start !== sidx) {
    console.error(
      `Invalid start index: ${start} (expected: ${sidx}, ${input} / ${pattern})`
    );
  }
  if (end !== eidx) {
    console.error(
      `Invalid end index: ${end} (expected: ${eidx}, ${input} / ${pattern})`
    );
  }
  if (res.score !== score) {
    console.error(
      `Invalid score: ${res.score} (expected: ${score}, ${input} / ${pattern})`
    );
  }
}

function testFuzzyMatch() {
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
    }
  }
}

testFuzzyMatch();
