import { Fzf, byLengthAsc, byStartAsc } from "../main";

test("byLengthAsc", () => {
  const list = ["aaaaa", "caaaaaaaa", "baaaaa"];

  const fzf = new Fzf(list, {
    tiebreakers: [byLengthAsc],
  });

  expect(fzf.find("aa").map((entry) => entry.item)).toMatchObject([
    "aaaaa",
    "baaaaa",
    "caaaaaaaa",
  ]);
});

test("byStartAsc", () => {
  const list = ["aaaa", "ccaaaa", "baaa"];

  const fzf = new Fzf(list, {
    tiebreakers: [byStartAsc],
  });

  expect(fzf.find("aa").map((entry) => entry.item)).toMatchObject([
    "aaaa",
    "baaa",
    "ccaaaa",
  ]);
});

test("multiple tiebreakers", () => {
  const list = ["aaba", "abaa", "abac", "aab", "baa"]
  const fzf = new Fzf(list, {tiebreakers: [byLengthAsc, byStartAsc]})
  expect(fzf.find("b").map(r => r.item)).toEqual([
    "baa", // highest score
    "aab", // shortest length
    "abaa", // startpos = 2, original index = 2
    "abac", // startpos = 2, original index = 3
    "aaba", // startpos = 2
  ])
})
